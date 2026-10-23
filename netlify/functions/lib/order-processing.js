// netlify/functions/lib/order-processing.js
// Lógica compartida para procesar pedidos (Stripe y PayPal):
// Google Sheets, Supabase user_orders y emails de confirmación/notificación/descarga
// Emails al cliente (confirmación, descarga) vía Resend — RESEND_API_KEY, RESEND_FROM_EMAIL
// Notificación a Andrea y registro de usuaria vía Formspree — FORMSPREE_ENDPOINT

// ── Google Sheets ─────────────────────────────────────────

// Detecta el tipo de cada product ID y escribe en la pestaña correspondiente
async function routeToSheets(order, productIds) {
  const isMasterclass = id => id.startsWith('masterclass-');
  const isCurso       = id => id.startsWith('curso-');
  const isSesion      = id => ['reporte-simbolos','tiradas-estacionales','tiradas-zodiacales'].includes(id);
  const isPhysical    = id => !isMasterclass(id) && !isCurso(id) && !isSesion(id);
  const cleanNum      = val => parseFloat((val || '0').replace(/[^0-9.]/g, '')) || 0;

  const writes = [];

  if (productIds.length === 0 || productIds.some(isPhysical)) {
    writes.push(writeToTab(order, 'Pedidos', [
      order.orderId, order.date, order.customer, order.email, order.phone,
      order.products, cleanNum(order.subtotal), cleanNum(order.shipping), cleanNum(order.total),
      order.address, order.postalCode, order.city, order.state, order.country,
      order.carrier, order.payment_method || '', order.status, order.notes,
    ]));
  }

  if (productIds.some(isMasterclass)) {
    const items = order.products.split(',').filter(p => p.toLowerCase().includes('masterclass'));
    writes.push(writeToTab(order, 'Masterclasses', [
      order.date, order.orderId, order.customer, order.email, order.phone,
      items.join(', ') || order.products, cleanNum(order.total), order.payment_method || '', order.status,
    ]));
  }

  if (productIds.some(isCurso)) {
    const items = order.products.split(',').filter(p => p.toLowerCase().includes('curso') || p.toLowerCase().includes('venus') || p.toLowerCase().includes('renacer'));
    writes.push(writeToTab(order, 'Cursos', [
      order.date, order.orderId, order.customer, order.email, order.phone,
      items.join(', ') || order.products, cleanNum(order.total), order.payment_method || '', order.status,
    ]));
  }

  if (productIds.some(isSesion)) {
    const isSimbolos = productIds.includes('reporte-simbolos');
    const isTirada = productIds.some(id => ['tiradas-estacionales','tiradas-zodiacales'].includes(id));
    const formato = isSimbolos ? 'PDF' : isTirada ? 'Nota de voz' : 'Google Meet';
    const duracion = isSimbolos ? '5-7 días hábiles' : isTirada ? '24-48 hrs' : '';

    writes.push(writeToTab(order, 'Sesiones', [
      order.date,              // Fecha reserva
      '',                      // Fecha sesión (no aplica)
      order.customer,          // Nombre
      order.email,             // Email
      order.products,          // Tipo de sesión
      duracion,                // Duración
      cleanNum(order.total),   // Precio
      order.payment_method || '', // Método de pago
      formato,                 // Formato
      order.notes,             // Datos nacimiento
      '',                      // Ciudad actual (no aplica)
      'Pagado',                // Status
      '',                      // Notas
    ]));
  }

  await Promise.all(writes);
}

async function writeToTab(order, tabName, row) {
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

  if (!sheetsId || !serviceAccountKey.client_email) {
    console.warn('Google Sheets no configurado — omitiendo');
    return;
  }

  const token = await getGoogleToken(serviceAccountKey);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sheets error en ${tabName}: ${err}`);
  }
}

async function getGoogleToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const { createSign } = require('crypto');

  const signingInput = `${encode(header)}.${encode(claim)}`;
  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}

// ── Supabase ───────────────────────────────────────────────

async function saveToSupabase(order, products, paymentId, paymentMethod) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error: sbError } = await supabase.from('user_orders').insert({
      email:             order.email,
      order_number:      order.orderId,
      products:          products || [],
      subtotal:          parseFloat((order.subtotal || '0').replace(/[^0-9.]/g, '')) || 0,
      shipping:          parseFloat((order.shipping || '0').replace(/[^0-9.]/g, '')) || 0,
      total:             parseFloat((order.total || '0').replace(/[^0-9.]/g, '')) || 0,
      shipping_address:  order.address || '',
      city:              order.city || '',
      state:             order.state || '',
      country:           order.country || 'MX',
      carrier:           order.carrier || '',
      tracking_number:   null,
      status:            'Nuevo',
      payment_id:        paymentId || '',
      payment_method:    paymentMethod || '',
    });
    if (sbError) throw new Error(sbError.message);

    console.log('✓ Order saved to Supabase:', order.email);
  } catch (err) {
    console.error('Supabase order save error:', err.message);
    // No bloqueamos el flujo si Supabase falla
  }
}

// Convierte "1x Producto A, 2x Producto B" en [{name, qty}, ...]
function parseProductsString(productsStr) {
  return (productsStr || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(\d+)x\s+(.+)$/);
    return m ? { name: m[2], qty: Number(m[1]) } : { name: s, qty: 1 };
  });
}

// ── Stock limitado ─────────────────────────────────────────

// Productos con cupo limitado — agregar aquí futuros productos con stock
const STOCK_LIMITED_PRODUCTS = ['taller-libreta-magica'];

// Descuenta una plaza por cada producto de cupo limitado incluido en el pedido
async function decrementLimitedStock(productIds) {
  for (const productId of STOCK_LIMITED_PRODUCTS) {
    if (!productIds.includes(productId)) continue;

    try {
      await fetch(`${process.env.URL}/.netlify/functions/decrement-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      console.log(`✓ Stock decremented for ${productId}`);
    } catch (err) {
      console.error('Stock decrement error:', err.message);
    }
  }
}

// ── Emails transaccionales vía Resend (al cliente) ──────────

// Escapa HTML para que datos ingresados por el cliente (nombre, dirección, etc.)
// no rompan el markup del correo
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Envoltura visual de marca — header morado + footer, colores/fuentes de css/styles.css
function brandEmailShell(bodyHtml) {
  return `
<body style="margin:0;padding:0;background:#faf6f0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(107,68,113,0.15);">
        <tr><td style="background:linear-gradient(135deg,#3d1f45,#6b4471);padding:36px 24px;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:3px;color:#d4a853;">✦ LECTORA DE ESTRELLAS ✦</div>
        </td></tr>
        <tr><td style="padding:32px 28px;font-family:Arial,Helvetica,sans-serif;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="background:#faf6f0;padding:20px 28px;text-align:center;border-top:1px solid #f5ede0;">
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#6b4471;margin:0;">Con amor cósmico,<br>Andrea ✦ Lectora de Estrellas</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>`;
}

async function sendResendEmail({ to, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Lectora de Estrellas <onboarding@resend.dev>',
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    console.error('Resend email error:', err.message);
    // No bloqueamos el flujo si el envío de correo falla
  }
}

async function sendConfirmationEmail(order) {
  const row = (label, value) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f5ede0;color:#9b7a9e;font-size:13px;">${label}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f5ede0;text-align:right;color:#3d2e3a;font-size:14px;">${escapeHtml(value)}</td>
    </tr>`;

  const html = brandEmailShell(`
    <p style="font-size:17px;color:#1a1118;margin:0 0 16px;">Hola ${escapeHtml(order.customer)}! ✦</p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 24px;">Tu pedido ha sido confirmado. Aquí está el resumen:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
      ${row('Número de pedido', order.orderId)}
      ${row('Fecha', order.date)}
      ${row('Productos', order.products)}
      ${row('Subtotal', order.subtotal)}
      ${row('Envío', order.shipping)}
      <tr>
        <td style="padding:14px 0 0;color:#3d1f45;font-weight:bold;font-size:16px;">Total</td>
        <td style="padding:14px 0 0;text-align:right;color:#3d1f45;font-weight:bold;font-size:16px;">${escapeHtml(order.total)}</td>
      </tr>
    </table>
    <div style="background:#f5ede0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="font-size:12px;color:#9b7a9e;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Dirección de entrega</p>
      <p style="font-size:14px;color:#3d2e3a;margin:0;line-height:1.5;">
        ${escapeHtml(order.address)}<br>
        ${escapeHtml(order.city)}, ${escapeHtml(order.state)} ${escapeHtml(order.postalCode)}<br>
        ${escapeHtml(order.country)}
      </p>
    </div>
    <p style="font-size:14px;color:#3d2e3a;line-height:1.6;margin:0 0 20px;">Te avisaremos cuando tu pedido esté en camino con el número de guía.</p>
    <p style="font-size:13px;color:#9b7a9e;line-height:1.6;margin:0;">Cualquier duda escríbeme a lalectorade.estrellas@gmail.com o en Instagram <a href="https://instagram.com/lectoradeestrellas" style="color:#6b4471;">@lectoradeestrellas</a></p>
  `);

  await sendResendEmail({
    to: order.email,
    subject: `✦ Confirmación de pedido ${order.orderId} — Lectora de Estrellas`,
    html,
    text: `
Hola ${order.customer}! ✦

Tu pedido ha sido confirmado. Aquí está el resumen:

Número de pedido: ${order.orderId}
Fecha: ${order.date}

Productos: ${order.products}
Subtotal: ${order.subtotal}
Envío: ${order.shipping}
Total: ${order.total}

Dirección de entrega:
${order.address}
${order.city}, ${order.state} ${order.postalCode}
${order.country}

Te avisaremos cuando tu pedido esté en camino con el número de guía.

Cualquier duda escríbeme a lalectorade.estrellas@gmail.com o en Instagram @lectoradeestrellas

Con amor cósmico,
Andrea ✦ Lectora de Estrellas
    `.trim(),
  });
}

async function sendAdminNotification(order) {
  const endpoint = process.env.FORMSPREE_ENDPOINT;
  if (!endpoint) return;

  await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _replyto: 'lalectorade.estrellas@gmail.com',
      _subject: `🛒 Nuevo pedido ${order.orderId} — ${order.total}`,
      message: `
NUEVO PEDIDO ${order.orderId}

Cliente: ${order.customer}
Email: ${order.email}
Teléfono: ${order.phone}

Productos: ${order.products}
Total: ${order.total}

Dirección: ${order.address}, ${order.city}, ${order.state} ${order.postalCode}

${order.notes ? `Datos especiales:\n${order.notes}` : ''}
      `.trim(),
    }),
  });
}

async function sendDownloadLink(order, downloadLinksJson) {
  if (!downloadLinksJson) return;

  let links;
  try { links = JSON.parse(downloadLinksJson); }
  catch { return; }

  const html = brandEmailShell(`
    <p style="font-size:17px;color:#1a1118;margin:0 0 16px;">Hola ${escapeHtml(order.customer)}! ✦</p>
    <p style="font-size:15px;color:#3d2e3a;line-height:1.6;margin:0 0 24px;">Tu producto digital está listo para descargar:</p>
    ${links.map(l => `
      <div style="margin-bottom:16px;">
        <p style="font-size:14px;color:#3d2e3a;margin:0 0 8px;font-weight:bold;">${escapeHtml(l.name)}</p>
        <a href="${l.url}" style="display:inline-block;background:#6b4471;color:#ffffff;font-size:13px;font-weight:bold;letter-spacing:0.5px;text-decoration:none;padding:12px 24px;border-radius:999px;">Descargar ✦</a>
      </div>`).join('')}
    <div style="background:#f5ede0;border-radius:8px;padding:14px 18px;margin-top:8px;">
      <p style="font-size:13px;color:#9b7a9e;margin:0;">Este link es para uso personal. Por favor no lo compartas.</p>
    </div>
  `);

  await sendResendEmail({
    to: order.email,
    subject: `✦ Tu descarga está lista — Lectora de Estrellas`,
    html,
    text: `
Hola ${order.customer}! ✦

Tu producto digital está listo para descargar:

${links.map(l => `${l.name}:\n${l.url}`).join('\n\n')}

Este link es para uso personal. Por favor no lo compartas.

Con amor cósmico,
Andrea ✦ Lectora de Estrellas
    `.trim(),
  });
}

module.exports = {
  routeToSheets,
  writeToTab,
  saveToSupabase,
  parseProductsString,
  sendConfirmationEmail,
  sendAdminNotification,
  sendDownloadLink,
  decrementLimitedStock,
  sendResendEmail,
  brandEmailShell,
  escapeHtml,
};
