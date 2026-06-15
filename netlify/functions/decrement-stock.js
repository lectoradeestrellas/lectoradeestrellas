// netlify/functions/decrement-stock.js
// Descuenta una plaza del stock de un producto con cupo limitado (tabla product_stock en Supabase)
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
    const { productId } = JSON.parse(event.body || '{}');
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

    // Decrement stock
    const { error: updateError } = await supabase
      .from('product_stock')
      .update({
        stock_available: data.stock_available - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', productId);

    if (updateError) throw updateError;

    console.log(`✓ Stock decremented for ${productId}: ${data.stock_available - 1} remaining`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, stock_remaining: data.stock_available - 1 }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
