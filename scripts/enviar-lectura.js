// Envía el PDF de una lectura a una clienta, con el diseño de marca.
// Uso: node scripts/enviar-lectura.js clienta@email.com "Nombre" ~/Downloads/lectura.pdf
// Requiere un archivo .env en la raíz con RESEND_API_KEY (y opcional RESEND_FROM_EMAIL)

const fs = require('fs');
const path = require('path');
const { brandEmailShell, escapeHtml } = require('../netlify/functions/lib/order-processing');

try { process.loadEnvFile(path.join(__dirname, '..', '.env')); } catch {}

const MENSAJE_DEFAULT = 'Gracias por compartir tu sesión conmigo. Te adjunto tu lectura en PDF para que puedas volver a ella cuando lo necesites.';

// Botón + aviso de descarga, solo si hay link de grabación
function grabacionHtml(url) {
  if (!url) return '';
  return `
    <div style="text-align:center;margin:0 0 16px;">
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#6b4471;color:#ffffff;font-size:13px;font-weight:bold;letter-spacing:0.5px;text-decoration:none;padding:12px 24px;border-radius:999px;">Ver tu grabación ✦</a>
    </div>
    <div style="background:#f5ede0;border-left:3px solid #d4a853;border-radius:8px;padding:14px 18px;margin-bottom:16px;">
      <p style="font-size:13px;color:#3d2e3a;line-height:1.5;margin:0;"><strong>Importante:</strong> descarga la grabación cuanto antes. Después de un mes se borra y ya no estará disponible.</p>
    </div>`;
}

function buildHtml(nombre, mensaje = MENSAJE_DEFAULT, grabacion) {
  return brandEmailShell(`
    <p style="font-size:17px;color:#1a1118;margin:0 0 16px;">Hola ${escapeHtml(nombre)}! ✦</p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 16px;">${escapeHtml(mensaje)}</p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 24px;">Tómate tu tiempo para leer con calma; las estrellas no tienen prisa.</p>
    ${grabacionHtml(grabacion)}
    <div style="background:#f5ede0;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <p style="font-size:13px;color:#6b4471;margin:0;">📎 Encontrarás el archivo adjunto en este correo.</p>
    </div>
    <p style="font-size:13px;color:#9b7a9e;line-height:1.6;margin:0;">Cualquier duda escríbeme a lalectorade.estrellas@gmail.com o en Instagram <a href="https://instagram.com/lectoradeestrellas" style="color:#6b4471;">@lectoradeestrellas</a></p>
  `);
}

async function main() {
  const args = process.argv.slice(2);

  // --grabacion URL agrega el botón de la grabación
  let grabacion;
  const gi = args.indexOf('--grabacion');
  if (gi !== -1) [, grabacion] = args.splice(gi, 2);

  // Vista previa: abre el correo en el navegador sin enviar nada
  if (args[0] === '--vista') {
    const file = path.join(require('os').tmpdir(), 'vista-lectura.html');
    fs.writeFileSync(file, `<meta charset="utf-8">${buildHtml(args[1] || 'Nombre', args[2] || undefined, grabacion)}`);
    require('child_process').execSync(`open "${file}"`);
    console.log('✓ Vista previa abierta en el navegador (no se envió nada)');
    return;
  }

  const [email, nombre, pdfPath, mensaje] = args;
  if (!email || !nombre || !pdfPath) {
    console.log('Uso: node scripts/enviar-lectura.js clienta@email.com "Nombre" ruta/al/archivo.pdf ["mensaje opcional"] [--grabacion URL]');
    console.log('Vista previa: node scripts/enviar-lectura.js --vista "Nombre" ["mensaje opcional"]');
    process.exit(1);
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('Falta RESEND_API_KEY en el archivo .env');
    process.exit(1);
  }

  const pdf = fs.readFileSync(pdfPath);
  const html = buildHtml(nombre, mensaje || undefined, grabacion);

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
      subject: '✦ Tu lectura — Lectora de Estrellas',
      html,
      text: `Hola ${nombre}! ✦\n\n${mensaje || MENSAJE_DEFAULT}\n\n${grabacion ? `Tu grabación: ${grabacion}\nImportante: descárgala cuanto antes, después de un mes se borra.\n\n` : ''}Tómate tu tiempo para leer con calma; las estrellas no tienen prisa.\n\nCon amor cósmico,\nAndrea ✦ Lectora de Estrellas`,
      attachments: [{ filename: path.basename(pdfPath), content: pdf.toString('base64') }],
    }),
  });

  if (!res.ok) {
    console.error('No se pudo enviar:', await res.text());
    process.exit(1);
  }
  console.log(`✓ Lectura enviada a ${email}`);
}

main();
