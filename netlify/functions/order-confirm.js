// netlify/functions/order-confirm.js
// Se dispara cuando Stripe confirma un pago
// Escribe fila en Google Sheets + envía email de confirmación
// Variables: STRIPE_WEBHOOK_SECRET, GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_KEY, FORMSPREE_ENDPOINT

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Verify Stripe webhook signature
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Only process successful payments
  if (stripeEvent.type !== 'payment_intent.succeeded' &&
      stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Ignored event type' };
  }

  const session = stripeEvent.data.object;
  const metadata = session.metadata || {};

  try {
    const orderData = {
      orderId:    `LDE-${Date.now()}`,
      date:       new Date().toLocaleString('es-MX', { timeZone: 'America/Monterrey' }),
      customer:   metadata.customerName || session.customer_details?.name || 'N/A',
      email:      metadata.customerEmail || session.customer_details?.email || 'N/A',
      phone:      metadata.customerPhone || 'N/A',
      address:    metadata.shippingAddress || 'N/A',
      postalCode: metadata.postalCode || 'N/A',
      city:       metadata.city || 'N/A',
      state:      metadata.state || 'N/A',
      country:    metadata.country || 'MX',
      products:   metadata.products || 'N/A',
      subtotal:   `$${((session.amount_subtotal || session.amount) / 100).toFixed(2)} MXN`,
      shipping:   metadata.shippingCost ? `$${metadata.shippingCost} MXN` : 'Por calcular',
      total:      `$${(session.amount / 100).toFixed(2)} MXN`,
      carrier:    metadata.carrier || 'N/A',
      status:     'Pagado',
      notes:      metadata.birthData || '', // For carta astral orders
    };

    // 1. Write to Google Sheets
    await writeToSheets(orderData);

    // 2. Send confirmation email to customer
    await sendConfirmationEmail(orderData);

    // 3. Send notification to you (Andrea)
    await sendAdminNotification(orderData);

    // 4. If digital product, send download link
    if (metadata.isDigital === 'true') {
      await sendDownloadLink(orderData, metadata.downloadLinks);
    }

    console.log(`Order ${orderData.orderId} processed successfully`);
    return { statusCode: 200, body: JSON.stringify({ success: true, orderId: orderData.orderId }) };

  } catch (err) {
    console.error('Order processing error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ── Google Sheets ─────────────────────────────────────────
async function writeToSheets(order) {
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

  if (!sheetsId || !serviceAccountKey.client_email) {
    console.warn('Google Sheets not configured — skipping');
    return;
  }

  // Get access token using service account JWT
  const token = await getGoogleToken(serviceAccountKey);

  const row = [
    order.orderId, order.date, order.customer, order.email, order.phone,
    order.products, order.subtotal, order.shipping, order.total,
    order.address, order.postalCode, order.city, order.state, order.country,
    order.carrier, order.status, order.notes,
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Pedidos!A:Q:append?valueInputOption=USER_ENTERED`,
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
    throw new Error(`Sheets error: ${err}`);
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
