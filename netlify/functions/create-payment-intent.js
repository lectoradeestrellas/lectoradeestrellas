// netlify/functions/create-payment-intent.js
// Crea un PaymentIntent de Stripe con los metadatos del pedido

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const { amount, currency, metadata } = JSON.parse(event.body);

    if (!amount || amount < 100) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Monto inválido' }) };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,           // in cents (MXN centavos)
      currency: currency || 'mxn',
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...metadata,
        source: 'lectoradeestrellas.com',
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };

  } catch (err) {
    console.error('Payment intent error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
