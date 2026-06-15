// netlify/functions/lib/order-processing.js
// Lógica compartida para procesar pedidos (Stripe y PayPal):
// Google Sheets, Supabase user_orders y emails de confirmación/notificación/descarga

// ── Google Sheets ─────────────────────────────────────────

// Detecta el tipo de cada product ID y escribe en la pestaña correspondiente
async function routeToSheets(order, productIds) {
  const isMasterclass = id => id.startsWith('masterclass-');
  const isCurso       = id => id.startsWith('curso-');
  const isSesion      = id => ['reporte-simbolos','tiradas-estacionales','tiradas-zodiacales'].includes(id);
  const isPhysical    = id => !isMasterclass(id) && !isCurso(id) && !isSesion(id);

  const writes = [];

  if (productIds.length === 0 || productIds.some(isPhysical)) {
    writes.push(writeToTab(order, 'Pedidos', [
      order.orderId, order.date, order.customer, order.email, order.phone,
      order.products, order.subtotal, order.shipping, order.total,
      order.address, order.postalCode, order.city, order.state, order.country,
      order.carrier, order.status, order.notes,
    ]));
  }

  if (productIds.some(isMasterclass)) {
    const items = order.products.split(',').filter(p => p.toLowerCase().includes('masterclass'));
    writes.push(writeToTab(order, 'Masterclasses', [
      order.date, order.orderId, order.customer, order.email, order.phone,
      items.join(', ') || order.products, order.total, order.status,
    ]));
  }

  if (productIds.some(isCurso)) {
    const items = order.products.split(',').filter(p => p.toLowerCase().includes('curso') || p.toLowerCase().includes('venus') || p.toLowerCase().includes('renacer'));
    writes.push(writeToTab(order, 'Cursos', [
      order.date, order.orderId, order.customer, order.email, order.phone,
      items.join(', ') || order.products, order.total, order.status,
    ]));
  }

  if (productIds.some(isSesion)) {
    writes.push(writeToTab(order, 'Sesiones', [
      order.date,
      order.orderId,
      order.customer,
      order.email,
      order.products,
      '',           // fechaSesion — no aplica para sesiones asíncronas
      order.total,
      order.notes,
      order.status,
      'Checkout',   // origen
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

    await supabase.from('user_orders').insert({
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

// ── Emails via Formspree ──────────────────────────────────
async function sendConfirmationEmail(order) {
  const endpoint = process.env.FORMSPREE_ENDPOINT;
  if (!endpoint) return;

  await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _replyto: order.email,
      _subject: `✦ Confirmación de pedido ${order.orderId} — Lectora de Estrellas`,
      email: order.email,
      message: `
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
    }),
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
  const endpoint = process.env.FORMSPREE_ENDPOINT;
  if (!endpoint || !downloadLinksJson) return;

  let links;
  try { links = JSON.parse(downloadLinksJson); }
  catch { return; }

  await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _replyto: order.email,
      _subject: `✦ Tu descarga está lista — Lectora de Estrellas`,
      email: order.email,
      message: `
Hola ${order.customer}! ✦

Tu producto digital está listo para descargar:

${links.map(l => `${l.name}:\n${l.url}`).join('\n\n')}

Este link es para uso personal. Por favor no lo compartas.

Con amor cósmico,
Andrea ✦ Lectora de Estrellas
      `.trim(),
    }),
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
};
