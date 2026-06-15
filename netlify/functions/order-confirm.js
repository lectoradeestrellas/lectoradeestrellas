// netlify/functions/order-confirm.js
// Se dispara cuando Stripe confirma un pago
// Escribe fila en Google Sheets + envía email de confirmación
// Variables: STRIPE_WEBHOOK_SECRET, GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_KEY, FORMSPREE_ENDPOINT

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
  routeToSheets,
  saveToSupabase,
  parseProductsString,
  sendConfirmationEmail,
  sendAdminNotification,
  sendDownloadLink,
  decrementLimitedStock,
} = require('./lib/order-processing');

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

    // 1. Write to Google Sheets (tab según tipo de producto)
    const productIds = (metadata.productIds || '').split(',').map(s => s.trim()).filter(Boolean);
    await routeToSheets(orderData, productIds);

    // 2. Guardar en Supabase user_orders
    await saveToSupabase(orderData, parseProductsString(metadata.products), session.id, 'stripe');

    // 3. Send confirmation email to customer
    await sendConfirmationEmail(orderData);

    // 4. Send notification to you (Andrea)
    await sendAdminNotification(orderData);

    // 5. If digital product, send download link
    if (metadata.isDigital === 'true') {
      await sendDownloadLink(orderData, metadata.downloadLinks);
    }

    // 6. Decrementar stock de productos con cupo limitado (ej. talleres)
    await decrementLimitedStock(productIds);

    console.log(`Order ${orderData.orderId} processed successfully`);
    return { statusCode: 200, body: JSON.stringify({ success: true, orderId: orderData.orderId }) };

  } catch (err) {
    console.error('Order processing error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
