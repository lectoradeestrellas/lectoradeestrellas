// netlify/functions/grant-access.js
// Grants access to a course or masterclass after successful payment
// Called from order-confirm.js after Stripe confirms payment

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  try {
    const { email, product_id, product_name, order_id } = JSON.parse(event.body);

    if (!email || !product_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'email y product_id son requeridos' }),
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Check if access already exists
    const { data: existing } = await supabase
      .from('user_access')
      .select('id')
      .eq('email', email)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Access already exists' }),
      };
    }

    // Grant access
    const { error } = await supabase
      .from('user_access')
      .insert({
        email,
        product_id,
        product_name: product_name || product_id,
        order_id: order_id || null,
        active: true,
      });

    if (error) throw error;

    console.log(`✓ Access granted: ${email} → ${product_id}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };

  } catch (err) {
    console.error('Grant access error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
