// Envía a una clienta las opciones de envío de su pedido (cuando el checkout no pudo calcularlo),
// cada una con su botón de pago, y la captura de la cotización adjunta.
// Uso:
//   node scripts/enviar-costo-envio.js clienta@email.com "Nombre" captura.png \
//     --opcion "Estafeta Ground|163|https://buy.stripe.com/..." --opcion "DHL Express|207|https://buy.stripe.com/..."
// Vista previa (no envía nada): agrega --vista
// Prueba (solo a tu correo): agrega --prueba
// Requiere un archivo .env en la raíz con RESEND_API_KEY (y opcional RESEND_FROM_EMAIL)

const fs = require('fs');
const path = require('path');
const { brandEmailShell, escapeHtml } = require('../netlify/functions/lib/order-processing');

try { process.loadEnvFile(path.join(__dirname, '..', '.env')); } catch {}

const MI_CORREO = 'lalectorade.estrellas@gmail.com';
const ASUNTO = '✦ Costo de envío de tu pedido — Lectora de Estrellas';

const precio = (n) => `$${Number(n).toLocaleString('es-MX')} MXN`;

function buildHtml(nombre, opciones) {
  const filas = opciones.map((o) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eadfd3;font-size:15px;color:#1a1118;">${escapeHtml(o.nombre)}${o.dias ? `<br><span style="font-size:13px;color:#9b7a9e;">Entrega en ${escapeHtml(o.dias)}</span>` : ""}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eadfd3;font-size:15px;color:#3d2e3a;text-align:right;white-space:nowrap;">${precio(o.precio)}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eadfd3;text-align:right;">
          <a href="${escapeHtml(o.link)}" style="display:inline-block;background:#6b4471;color:#ffffff;font-size:12px;font-weight:bold;letter-spacing:0.5px;text-decoration:none;padding:9px 16px;border-radius:999px;white-space:nowrap;">Pagar ✦</a>
        </td>
      </tr>`).join('');

  return brandEmailShell(`
    <p style="font-size:17px;color:#1a1118;margin:0 0 16px;">Hola ${escapeHtml(nombre)}! ✦</p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 16px;">Muchas gracias por tu pedido. Al momento de tu compra la página no pudo calcular el costo de envío a tu código postal, así que lo revisé y estas son las opciones disponibles (te adjunto la captura de la cotización):</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">${filas}
    </table>

    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 24px;">Elige la opción que prefieras y da clic en su botón para pagarla. Es necesario cubrir el costo de envío para poder despachar tu pedido. Te recuerdo que los envíos inician a partir de diciembre y se realizan en el orden en que se recibieron las compras.</p>

    <p style="font-size:13px;color:#9b7a9e;line-height:1.6;margin:0;">Cualquier duda, responde a este correo o escríbeme en Instagram <a href="https://instagram.com/lectoradeestrellas" style="color:#6b4471;">@lectoradeestrellas</a></p>
  `);
}

function buildText(nombre, opciones) {
  return `Hola ${nombre}! ✦

Muchas gracias por tu pedido. Al momento de tu compra la página no pudo calcular el costo de envío a tu código postal, así que lo revisé y estas son las opciones disponibles (te adjunto la captura de la cotización):

${opciones.map((o) => `✦ ${o.nombre} — ${precio(o.precio)}${o.dias ? ` (entrega en ${o.dias})` : ''}\n  Pagar: ${o.link}`).join('\n')}

Elige la opción que prefieras y da clic en su link para pagarla. Es necesario cubrir el costo de envío para poder despachar tu pedido. Te recuerdo que los envíos inician a partir de diciembre y se realizan en el orden en que se recibieron las compras.

Cualquier duda, responde a este correo o escríbeme en Instagram @lectoradeestrellas

Con amor cósmico,
Andrea ✦ Lectora de Estrellas`;
}

async function main() {
  const args = process.argv.slice(2);
  const vista = args.includes('--vista');
  const prueba = args.includes('--prueba');
  const opciones = [];
  const resto = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--opcion') {
      const [nombre, monto, link, dias] = (args[++i] || '').split('|').map((s) => s.trim());
      if (!nombre || !monto || !link) { console.error(`Opción incompleta: "${args[i]}" (formato "Paquetería|precio|link")`); process.exit(1); }
      opciones.push({ nombre, precio: monto.replace(/[$,]/g, ''), link, dias });
    } else if (!args[i].startsWith('--')) resto.push(args[i]);
  }
  const [email, nombre, captura] = resto;

  if (!email || !nombre || !captura || !opciones.length) {
    console.log('Uso: node scripts/enviar-costo-envio.js clienta@email.com "Nombre" captura.png --opcion "Paquetería|precio|link|días (opcional)" [--opcion ...] [--vista | --prueba]');
    process.exit(1);
  }
  if (!fs.existsSync(captura)) { console.error(`No encontré la captura: ${captura}`); process.exit(1); }

  if (vista) {
    const file = path.join(require('os').tmpdir(), 'vista-costo-envio.html');
    fs.writeFileSync(file, `<meta charset="utf-8">${buildHtml(nombre, opciones)}<p style="text-align:center;font-family:sans-serif;color:#9b7a9e">📎 Adjunto: ${escapeHtml(path.basename(captura))}</p>`);
    require('child_process').execSync(`open "${file}"`);
    console.log(`✓ Vista previa abierta en el navegador (no se envió nada). Se enviaría a ${email}`);
    return;
  }

  if (!process.env.RESEND_API_KEY) { console.error('Falta RESEND_API_KEY en el archivo .env'); process.exit(1); }

  const destino = prueba ? MI_CORREO : email;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Lectora de Estrellas <onboarding@resend.dev>',
      to: [destino],
      reply_to: MI_CORREO,
      subject: ASUNTO,
      html: buildHtml(nombre, opciones),
      text: buildText(nombre, opciones),
      attachments: [{ filename: `cotizacion-envio${path.extname(captura).toLowerCase() || '.png'}`, content: fs.readFileSync(captura).toString('base64') }],
    }),
  });
  if (!res.ok) { console.error('No se pudo enviar:', await res.text()); process.exit(1); }
  console.log(prueba ? `✓ Prueba enviada a ${MI_CORREO} (a ${email} no se le envió nada)` : `✓ Correo enviado a ${email}`);
}

main();
