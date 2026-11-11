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
    const { postalCode, city, state, street, items } = JSON.parse(event.body);

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

    // Agendas, libretas y diarios pesan ~400 g. Si el pedido es UNO solo, va en sobre de envío (20×15×3 cm)
    const ENVELOPE_IDS = ['agenda-lunar-2027', 'diario-lunar-2027'];
    const ENVELOPE_PREFIXES = ['libreta-', 'diario-zodiacal-'];
    const isEnvelopeItem = id => ENVELOPE_IDS.includes(id) || ENVELOPE_PREFIXES.some(p => String(id || '').startsWith(p));
    const itemWeight = item => item.weight || (isEnvelopeItem(item.id) ? 0.4 : 0.3);
    const totalWeight = items.reduce((sum, item) => sum + itemWeight(item) * (item.qty || 1), 0);
    const totalUnits = items.reduce((sum, item) => sum + (item.qty || 1), 0);
    const useEnvelope = totalUnits === 1 && isEnvelopeItem(items[0].id);

    const boxPackage = {
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
    };
    const envelopePackage = {
      content: 'Productos Lectora de Estrellas',
      amount: 1,
      type: 'envelope',
      dimensions: { length: 20, width: 15, height: 3 },
      weight: 0.4,
      insurance: 0,
      declaredValue: 0,
    };

    const basePayload = {
      origin: {
        postalCode: '64630',
        country: 'MX',
        city: 'Monterrey',
        state: 'NL',
        street: 'Origen',
        number: '1',
      },
      destination: {
        postalCode,
        country: 'MX',
        city: city || '',
        state: toStateCode(state),
        street: street || 'Destino',
        number: '1',
      },
      packages: [useEnvelope ? envelopePackage : boxPackage],
    };

    // Envia.com requiere una petición individual por paquetería
    const CARRIERS = ['fedex', 'estafeta', 'dhl', 'ups'];

    async function quoteCarrier(carrier, payload = basePayload) {
      try {
        const res = await fetch('https://api.envia.com/ship/rate/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ ...payload, shipment: { carrier, type: 1 } }),
        });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return [];
        const data = await res.json();
        if (data.meta === 'error' || data.error || data.message === 'Internal error') return [];
        return data.data || [];
      } catch {
        return [];
      }
    }

    let results = await Promise.all(CARRIERS.map(c => quoteCarrier(c)));

    // Si ninguna paquetería cotiza el sobre, se cotiza como caja para no dejar a la clienta sin envío
    if (useEnvelope && !results.flat().some(r => r.totalPrice > 0)) {
      console.warn('Sin cotizaciones para sobre — cotizando como caja');
      const boxPayload = { ...basePayload, packages: [{ ...boxPackage, weight: 0.4 }] };
      results = await Promise.all(CARRIERS.map(c => quoteCarrier(c, boxPayload)));
    }

    const rates = results.flat()
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

function toStateCode(state) {
  if (!state) return '';
  const s = state.trim().toLowerCase();
  const map = {
    'aguascalientes':'AGS','baja california':'BC','baja california norte':'BC',
    'baja california sur':'BCS','campeche':'CAM','chiapas':'CHIS','chihuahua':'CHIH',
    'ciudad de mexico':'DF','cdmx':'DF','df':'DF','distrito federal':'DF',
    'coahuila':'COAH','colima':'COL','durango':'DGO','guanajuato':'GTO',
    'guerrero':'GRO','hidalgo':'HGO','jalisco':'JAL','mexico':'MEX',
    'estado de mexico':'MEX','michoacan':'MICH','michoacán':'MICH','morelos':'MOR',
    'nayarit':'NAY','nuevo leon':'NL','nuevo león':'NL','oaxaca':'OAX',
    'puebla':'PUE','queretaro':'QRO','querétaro':'QRO','quintana roo':'QROO',
    'san luis potosi':'SLP','san luis potosí':'SLP','sinaloa':'SIN','sonora':'SON',
    'tabasco':'TAB','tamaulipas':'TAMS','tlaxcala':'TLAX','veracruz':'VER',
    'yucatan':'YUC','yucatán':'YUC','zacatecas':'ZAC',
  };
  return map[s] || state.slice(0, 4).toUpperCase();
}

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
