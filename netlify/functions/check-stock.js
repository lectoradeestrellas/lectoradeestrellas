// netlify/functions/check-stock.js
// Verifica el stock disponible de un producto con cupo limitado (tabla product_stock en Supabase)
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

    const { data, error } = await supabase
      .from('product_stock')
      .select('stock_available, stock_total')
      .eq('product_id', productId)
      .single();

    if (error || !data) {
      return { statusCode: 200, headers, body: JSON.stringify({ available: true }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        available: data.stock_available > 0,
        stock_available: data.stock_available,
        stock_total: data.stock_total,
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
