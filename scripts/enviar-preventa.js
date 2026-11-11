// Envía el aviso de preventa exclusiva de la Agenda Lunar 2027, con el diseño de marca.
// Uso: node scripts/enviar-preventa.js "Nombre" correo@email.com ["Nombre 2" correo2@email.com ...]
// Vista previa (no envía nada): node scripts/enviar-preventa.js --vista ["Nombre"]
// Requiere un archivo .env en la raíz con RESEND_API_KEY (y opcional RESEND_FROM_EMAIL)

const fs = require('fs');
const path = require('path');
const { brandEmailShell, escapeHtml } = require('../netlify/functions/lib/order-processing');

try { process.loadEnvFile(path.join(__dirname, '..', '.env')); } catch {}

const AGENDA_URL = 'https://lectoradeestrellas.com/producto-agenda-lunar-2027.html';
// La imagen se toma del sitio publicado (en --vista se usa la copia local)
let IMG_URL = 'https://lectoradeestrellas.com/images/productos/agenda-lunar-2027-1.jpg';
const ASUNTO = '✦ Tu acceso anticipado a la preventa de la Agenda Lunar 2027';

function buildHtml(nombre) {
  return brandEmailShell(`
    <p style="font-size:17px;color:#1a1118;margin:0 0 16px;">Hola ${escapeHtml(nombre)}! ✦</p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 16px;">Gracias por tomarte el tiempo de responder la encuesta de la Agenda Lunar. Tus respuestas me ayudaron muchísimo a darle forma a la nueva edición, y por eso quiero que seas de las primeras en tenerla.</p>
    <a href="${AGENDA_URL}" style="display:block;margin:0 0 24px;"><img src="${IMG_URL}" alt="Agenda Lunar 2027" width="100%" style="display:block;width:100%;max-width:520px;height:auto;border-radius:12px;margin:0 auto;"></a>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 24px;">La <strong>Agenda Lunar 2027</strong> abre su preventa y tú tienes acceso exclusivo un día antes que todas:</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background:#3d1f45;border-radius:8px 8px 0 0;">
          <p style="font-size:11px;color:#d4a853;margin:0 0 4px;text-transform:uppercase;letter-spacing:1.5px;">Tu preventa exclusiva</p>
          <p style="font-size:17px;color:#ffffff;margin:0;font-weight:bold;">Jueves 12 de noviembre</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background:#f5ede0;border-radius:0 0 8px 8px;">
          <p style="font-size:11px;color:#9b7a9e;margin:0 0 4px;text-transform:uppercase;letter-spacing:1.5px;">Preventa general</p>
          <p style="font-size:15px;color:#3d2e3a;margin:0;">Viernes 13 de noviembre</p>
        </td>
      </tr>
    </table>

    <div style="background:#f5ede0;border-left:3px solid #d4a853;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="font-size:14px;color:#3d2e3a;line-height:1.6;margin:0;"><strong>Solo hay 15 agendas en preventa.</strong> Al apartarla un día antes, aseguras la tuya antes de que se abra para todas.</p>
    </div>

    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 8px;">✦ <strong>Precio de preventa: $850 MXN</strong> <span style="color:#9b7a9e;text-decoration:line-through;">$1,050</span></p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 8px;">✦ También está el <strong>Bundle Lunar 2027</strong>: Agenda + Print Calendario Lunar con marco + Calendario Mini de Escritorio, con el Diario Lunar 2027 de regalo, por $1,300 MXN en preventa.</p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 28px;">✦ Los envíos comienzan en diciembre, en el orden en que llegan los pedidos, ya que cada agenda se elabora de forma artesanal.</p>

    <div style="text-align:center;margin:0 0 28px;">
      <a href="${AGENDA_URL}" style="display:inline-block;background:#6b4471;color:#ffffff;font-size:13px;font-weight:bold;letter-spacing:0.5px;text-decoration:none;padding:14px 28px;border-radius:999px;">Apartar mi Agenda Lunar 2027 ✦</a>
    </div>

    <p style="font-size:13px;color:#9b7a9e;line-height:1.6;margin:0;">Cualquier duda escríbeme a lalectorade.estrellas@gmail.com o en Instagram <a href="https://instagram.com/lectoradeestrellas" style="color:#6b4471;">@lectoradeestrellas</a></p>
  `);
}

function buildText(nombre) {
  return `Hola ${nombre}! ✦

Gracias por tomarte el tiempo de responder la encuesta de la Agenda Lunar. Tus respuestas me ayudaron muchísimo a darle forma a la nueva edición, y por eso quiero que seas de las primeras en tenerla.

La Agenda Lunar 2027 abre su preventa y tú tienes acceso exclusivo un día antes que todas:

Tu preventa exclusiva: jueves 12 de noviembre
Preventa general: viernes 13 de noviembre

Solo hay 15 agendas en preventa. Al apartarla un día antes, aseguras la tuya antes de que se abra para todas.

✦ Precio de preventa: $850 MXN (antes $1,050)
✦ Bundle Lunar 2027: Agenda + Print Calendario Lunar con marco + Calendario Mini de Escritorio, con el Diario Lunar 2027 de regalo, por $1,300 MXN en preventa.
✦ Los envíos comienzan en diciembre, en el orden en que llegan los pedidos, ya que cada agenda se elabora de forma artesanal.

Aparta tu agenda aquí: ${AGENDA_URL}

Cualquier duda escríbeme a lalectorade.estrellas@gmail.com o en Instagram @lectoradeestrellas

Con amor cósmico,
Andrea ✦ Lectora de Estrellas`;
}

async function main() {
  const args = process.argv.slice(2);

  // Vista previa: abre el correo en el navegador sin enviar nada
  if (args[0] === '--vista') {
    const file = path.join(require('os').tmpdir(), 'vista-preventa.html');
    // El navegador bloquea imágenes file:// locales, así que en la vista se usa una copia junto al archivo
    fs.copyFileSync(path.join(__dirname, '..', 'images', 'productos', 'agenda-lunar-2027-1.jpg'), path.join(path.dirname(file), 'agenda-lunar-2027-1.jpg'));
    IMG_URL = 'agenda-lunar-2027-1.jpg';
    fs.writeFileSync(file, `<meta charset="utf-8">${buildHtml(args[1] || 'Nombre')}`);
    require('child_process').execSync(`open "${file}"`);
    console.log('✓ Vista previa abierta en el navegador (no se envió nada)');
    return;
  }

  if (args.length === 0 || args.length % 2 !== 0) {
    console.log('Uso: node scripts/enviar-preventa.js "Nombre" correo@email.com ["Nombre 2" correo2@email.com ...]');
    console.log('Vista previa: node scripts/enviar-preventa.js --vista ["Nombre"]');
    process.exit(1);
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('Falta RESEND_API_KEY en el archivo .env');
    process.exit(1);
  }

  // Un correo por persona, para que ninguna vea el correo de las demás
  for (let i = 0; i < args.length; i += 2) {
    const [nombre, email] = [args[i], args[i + 1]];
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Lectora de Estrellas <onboarding@resend.dev>',
        to: [email],
        reply_to: 'lalectorade.estrellas@gmail.com',
        subject: ASUNTO,
        html: buildHtml(nombre),
        text: buildText(nombre),
      }),
    });

    if (!res.ok) {
      console.error(`✗ No se pudo enviar a ${email}:`, await res.text());
      continue;
    }
    console.log(`✓ Enviado a ${nombre} (${email})`);
  }
}

main();
