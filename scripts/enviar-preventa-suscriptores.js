// Envía el anuncio de la preventa de la Agenda Lunar 2027 a la lista de suscriptoras, con el diseño de marca.
// Uso: node scripts/enviar-preventa-suscriptores.js lista.csv
// Prueba (solo a tu correo): node scripts/enviar-preventa-suscriptores.js lista.csv --prueba
// Vista previa (no envía nada): node scripts/enviar-preventa-suscriptores.js --vista ["Nombre"]
// El CSV necesita una columna con correos; si tiene una columna "nombre" o "name", se usa en el saludo.
// Requiere un archivo .env en la raíz con RESEND_API_KEY (y opcional RESEND_FROM_EMAIL)

const fs = require('fs');
const path = require('path');
const { brandEmailShell, escapeHtml } = require('../netlify/functions/lib/order-processing');

try { process.loadEnvFile(path.join(__dirname, '..', '.env')); } catch {}

const SITE = 'https://lectoradeestrellas.com';
const AGENDA_URL = `${SITE}/producto-agenda-lunar-2027.html`;
const MI_CORREO = 'lalectorade.estrellas@gmail.com';
const ASUNTO = '🌙 La Agenda Lunar 2027 ya está en preventa';
// La imagen se toma del sitio publicado (en --vista se usa una copia local)
let IMG_URL = `${SITE}/images/productos/agenda-lunar-2027-1.jpg`;

function buildHtml(nombre) {
  const saludo = nombre ? `Hola ${escapeHtml(nombre)}! ✦` : 'Hola! ✦';
  return brandEmailShell(`
    <p style="font-size:17px;color:#1a1118;margin:0 0 16px;">${saludo}</p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 24px;">Ya está aquí: la <strong>Agenda Lunar 2027</strong> abrió su preventa. Es tu compañera para sincronizarte con los ciclos de la luna cada día del año, realizada a mano con intención y magia.</p>

    <a href="${AGENDA_URL}" style="display:block;margin:0 0 24px;"><img src="${IMG_URL}" alt="Agenda Lunar 2027" width="100%" style="display:block;width:100%;max-width:520px;height:auto;border-radius:12px;margin:0 auto;"></a>

    <div style="background:#f5ede0;border-left:3px solid #d4a853;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="font-size:14px;color:#3d2e3a;line-height:1.6;margin:0;"><strong>Solo hay 15 agendas en preventa.</strong></p>
    </div>

    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 8px;">✦ <strong>Precio de preventa: $850 MXN</strong> <span style="color:#9b7a9e;text-decoration:line-through;">$1,050</span></p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 8px;">✦ Edición numerada, media carta, 328 páginas con separadores, espiral plateado y listón separador.</p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 8px;">✦ También está el <strong>Bundle Lunar 2027</strong>: Agenda + Print Calendario Lunar con marco + Calendario Mini de Escritorio, con el Diario Lunar 2027 de regalo, por $1,300 MXN en preventa.</p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 28px;">✦ Los envíos comienzan en diciembre, en el orden en que llegan los pedidos, ya que cada agenda se elabora de forma artesanal.</p>

    <div style="text-align:center;margin:0 0 28px;">
      <a href="${AGENDA_URL}" style="display:inline-block;background:#6b4471;color:#ffffff;font-size:13px;font-weight:bold;letter-spacing:0.5px;text-decoration:none;padding:14px 28px;border-radius:999px;">Apartar mi Agenda Lunar 2027 ✦</a>
    </div>

    <p style="font-size:14px;color:#3d2e3a;line-height:1.6;margin:0 0 20px;">¿Quieres ver cómo se hacen? En la página de la agenda está mi mini serie de YouTube donde te muestro todo el proceso.</p>

    <p style="font-size:13px;color:#9b7a9e;line-height:1.6;margin:0 0 12px;">Cualquier duda escríbeme a ${MI_CORREO} o en Instagram <a href="https://instagram.com/lectoradeestrellas" style="color:#6b4471;">@lectoradeestrellas</a></p>
    <p style="font-size:11px;color:#b9a5bb;line-height:1.5;margin:0;">Recibes este correo porque te suscribiste a Lectora de Estrellas. Si ya no quieres recibir correos, responde a este mensaje con la palabra "baja".</p>
  `);
}

function buildText(nombre) {
  return `${nombre ? `Hola ${nombre}! ✦` : 'Hola! ✦'}

Ya está aquí: la Agenda Lunar 2027 abrió su preventa. Es tu compañera para sincronizarte con los ciclos de la luna cada día del año, realizada a mano con intención y magia.

Solo hay 15 agendas en preventa.

✦ Precio de preventa: $850 MXN (antes $1,050)
✦ Edición numerada, media carta, 328 páginas con separadores, espiral plateado y listón separador.
✦ Bundle Lunar 2027: Agenda + Print Calendario Lunar con marco + Calendario Mini de Escritorio, con el Diario Lunar 2027 de regalo, por $1,300 MXN en preventa.
✦ Los envíos comienzan en diciembre, en el orden en que llegan los pedidos, ya que cada agenda se elabora de forma artesanal.

Aparta tu agenda aquí: ${AGENDA_URL}

¿Quieres ver cómo se hacen? En la página de la agenda está mi mini serie de YouTube donde te muestro todo el proceso.

Cualquier duda escríbeme a ${MI_CORREO} o en Instagram @lectoradeestrellas

Con amor cósmico,
Andrea ✦ Lectora de Estrellas

Recibes este correo porque te suscribiste a Lectora de Estrellas. Si ya no quieres recibir correos, responde a este mensaje con la palabra "baja".`;
}

// Lee el CSV: detecta la columna de correos y, si existe, la de nombres
function leerLista(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const sep = (raw.split('\n')[0].match(/;/g) || []).length > (raw.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const rows = raw.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, '')));
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const header = rows[0].some(isEmail) ? null : rows[0].map((h) => h.toLowerCase());
  const data = header ? rows.slice(1) : rows;
  const emailCol = header?.findIndex((h) => /correo|email|e-mail|mail/.test(h)) ?? -1;
  const nameCol = header?.findIndex((h) => /nombre|name/.test(h)) ?? -1;

  const vistos = new Set();
  const lista = [];
  for (const row of data) {
    const email = (emailCol >= 0 ? row[emailCol] : row.find(isEmail) || '').toLowerCase();
    if (!isEmail(email) || vistos.has(email)) continue;
    vistos.add(email);
    const nombre = nameCol >= 0 ? (row[nameCol] || '').split(/\s+/)[0] : '';
    lista.push({ email, nombre });
  }
  return lista;
}

async function enviar({ email, nombre }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Lectora de Estrellas <onboarding@resend.dev>',
      to: [email],
      reply_to: MI_CORREO,
      subject: ASUNTO,
      html: buildHtml(nombre),
      text: buildText(nombre),
      headers: { 'List-Unsubscribe': `<mailto:${MI_CORREO}?subject=baja>` },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function main() {
  const args = process.argv.slice(2);

  // Vista previa: abre el correo en el navegador sin enviar nada
  if (args[0] === '--vista') {
    const file = path.join(require('os').tmpdir(), 'vista-preventa-suscriptores.html');
    // El navegador bloquea imágenes file:// locales, así que en la vista se usa una copia junto al archivo
    fs.copyFileSync(path.join(__dirname, '..', 'images', 'productos', 'agenda-lunar-2027-1.jpg'), path.join(path.dirname(file), 'agenda-lunar-2027-1.jpg'));
    IMG_URL = 'agenda-lunar-2027-1.jpg';
    fs.writeFileSync(file, `<meta charset="utf-8">${buildHtml(args[1] || '')}`);
    require('child_process').execSync(`open "${file}"`);
    console.log('✓ Vista previa abierta en el navegador (no se envió nada)');
    return;
  }

  if (!args[0]) {
    console.log('Uso: node scripts/enviar-preventa-suscriptores.js lista.csv [--prueba]');
    console.log('Vista previa: node scripts/enviar-preventa-suscriptores.js --vista ["Nombre"]');
    process.exit(1);
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('Falta RESEND_API_KEY en el archivo .env');
    process.exit(1);
  }

  const lista = leerLista(args[0]);

  if (args.includes('--prueba')) {
    await enviar({ email: MI_CORREO, nombre: lista.find((p) => p.nombre)?.nombre || '' });
    console.log(`✓ Prueba enviada a ${MI_CORREO} (la lista tiene ${lista.length} correos, no se les envió nada)`);
    return;
  }

  // Un correo por persona, para que nadie vea los correos de los demás
  let enviados = 0;
  for (const persona of lista) {
    try {
      await enviar(persona);
      enviados++;
      console.log(`✓ ${persona.email}`);
    } catch (err) {
      console.error(`✗ No se pudo enviar a ${persona.email}:`, err.message);
    }
    // Resend permite pocos envíos por segundo
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`\nListo: ${enviados} de ${lista.length} enviados.`);
}

main();
