// netlify/functions/paypal-confirm.js
// Se dispara desde checkout.html tras capturar un pago de PayPal
// Hace lo mismo que order-confirm.js (Stripe): escribe en Google Sheets,
// guarda en Supabase user_orders, envía email de confirmación a la clienta,
// notificación a Andrea y, si hay productos digitales, el link de descarga.
// Variables: GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_KEY, FORMSPREE_ENDPOINT, SUPABASE_URL, SUPABASE_SERVICE_KEY

const {
  routeToSheets,
  saveToSupabase,
  sendConfirmationEmail,
  sendAdminNotification,
  sendDownloadLink,
  decrementLimitedStock,
} = require('./lib/order-processing');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const products = Array.isArray(body.products) ? body.products : [];

  try {
    const orderData = {
      orderId:    `LDE-${Date.now()}`,
      date:       new Date().toLocaleString('es-MX', { timeZone: 'America/Monterrey' }),
      customer:   body.customerName || 'N/A',
      email:      body.customerEmail || 'N/A',
      phone:      body.customerPhone || 'N/A',
      address:    body.shippingAddress || 'N/A',
      postalCode: body.postalCode || 'N/A',
      city:       body.city || 'N/A',
      state:      body.state || 'N/A',
      country:    body.country || 'MX',
      products:   products.map(p => `${p.qty || 1}x ${p.name}`).join(', ') || 'N/A',
      subtotal:   `$${products.reduce((s, p) => s + (p.price || 0) * (p.qty || 1), 0).toFixed(2)} MXN`,
      shipping:   body.shippingCost ? `$${body.shippingCost} MXN` : 'Por calcular',
      total:      `$${Number(body.total || 0).toFixed(2)} MXN`,
      carrier:    body.carrier || 'N/A',
      status:     'Pagado',
      notes:      body.birthData || '', // For carta astral orders
    };

    // 1. Write to Google Sheets (tab según tipo de producto)
    const productIds = products.map(p => p.id).filter(Boolean);
    await routeToSheets(orderData, productIds);

    // 2. Guardar en Supabase user_orders
    await saveToSupabase(orderData, products, body.paypalOrderId, 'paypal');

    // 3. Send confirmation email to customer
    await sendConfirmationEmail(orderData);

    // 4. Send notification to you (Andrea)
    await sendAdminNotification(orderData);

    // 5. If digital product, send download link
    if (body.isDigital === 'true') {
      await sendDownloadLink(orderData, body.downloadLinks);
    }

    // 6. Decrementar stock de productos con cupo limitado (ej. talleres)
    await decrementLimitedStock(productIds);

    console.log(`PayPal order ${orderData.orderId} processed successfully`);
    return { statusCode: 200, body: JSON.stringify({ success: true, orderId: orderData.orderId }) };

  } catch (err) {
    console.error('PayPal order processing error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
