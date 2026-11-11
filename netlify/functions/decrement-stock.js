// netlify/functions/decrement-stock.js
// Descuenta plazas/unidades del stock de un producto con cupo limitado (tabla product_stock en Supabase)
// Se llama desde order-confirm.js / paypal-confirm.js tras confirmar un pago exitoso
// Variables: SUPABASE_URL, SUPABASE_SERVICE_KEY

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const { productId, quantity } = JSON.parse(event.body || '{}');
    const units = Math.max(1, Math.floor(Number(quantity) || 1));
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // Get current stock
    const { data, error } = await supabase
      .from('product_stock')
      .select('stock_available')
      .eq('product_id', productId)
      .single();

    if (error || !data) throw new Error('Product not found');
    if (data.stock_available <= 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: false, message: 'No hay plazas disponibles' }),
      };
    }

    if (units > data.stock_available) {
      console.warn(`⚠ Se vendieron ${units} de ${productId} pero solo quedaban ${data.stock_available}`);
    }
    const remaining = Math.max(0, data.stock_available - units);

    // Decrement stock
    const { error: updateError } = await supabase
      .from('product_stock')
      .update({
        stock_available: remaining,
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', productId);

    if (updateError) throw updateError;

    console.log(`✓ Stock decremented for ${productId}: ${remaining} remaining`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, stock_remaining: remaining }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
