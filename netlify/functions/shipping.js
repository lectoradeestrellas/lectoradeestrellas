// netlify/functions/shipping.js
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { postalCode, items } = JSON.parse(event.body);

    if (!postalCode || !items?.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Se requiere CP y productos' }),
      };
    }

    const apiKey = process.env.ENVIA_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key no configurada' }),
      };
    }

    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0.3) * (item.qty || 1), 0);

    const payload = {
      origin: {
        postal_code: '64630',
        country: 'MX',
      },
      destination: {
        postal_code: postalCode,
        country: 'MX',
      },
      packages: [{
        content: 'Productos Lectora de Estrellas',
        amount: items.length,
        type: 'box',
        dimensions: {
          length: 25,
          width: 20,
          height: items.length * 3 + 5,
        },
        weight: Math.max(0.1, totalWeight),
        insurance: 0,
        declaredValue: 0,
      }],
      shipment: {
        carrier: ['fedex', 'estafeta', 'dhl', 'redpack', 'ups'],
        type: 1,
      },
    };

    const response = await fetch('https://api.envia.com/ship/rate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Envia.com error:', errText);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          rates: [],
          fallback: true,
          message: 'No se pudo calcular el envío automáticamente. Te contactaremos con el costo.',
        }),
      };
    }

    const data = await response.json();

    const rates = (data.data || [])
      .filter(r => r.totalPrice > 0)
      .map(r => ({
        carrier: r.carrier,
        service: r.service,
        price: Math.ceil(r.totalPrice),
        currency: 'MXN',
        days: r.deliveryEstimation || '3-7 días',
        logo: getCarrierLogo(r.carrier),
      }))
      .sort((a, b) => a.price - b.price);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ rates }),
    };

  } catch (err) {
    console.error('Shipping function error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        rates: [],
        fallback: true,
        message: 'Error calculando envío. Te contactaremos con el costo.',
      }),
    };
  }
};

function getCarrierLogo(carrier) {
  const logos = {
    fedex:    'https://logo.clearbit.com/fedex.com',
    estafeta: 'https://logo.clearbit.com/estafeta.com',
    dhl:      'https://logo.clearbit.com/dhl.com',
    redpack:  'https://logo.clearbit.com/redpack.com.mx',
    ups:      'https://logo.clearbit.com/ups.com',
  };
  return logos[carrier?.toLowerCase()] || '';
}
