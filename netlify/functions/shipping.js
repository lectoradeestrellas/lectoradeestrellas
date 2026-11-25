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
    const body = JSON.parse(event.body);
    const { city, state, street, items } = body;
    const country = String(body.country || "MX").toUpperCase();
    let postalCode = String(body.postalCode || "").trim();

    if (!postalCode || !items?.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Se requiere CP y productos' }),
      };
    }

    // Países sin cotización automática ("Otro país")
    if (!/^[A-Z]{2}$/.test(country)) {
      return { statusCode: 200, headers, body: JSON.stringify({ rates: [] }) };
    }

    // En México el estado y la ciudad se obtienen del CP: si la clienta deja el estado vacío
    // o lo escribe abreviado ("N.L.", "Edo. Méx"), envia.com no regresa ninguna cotización
    let geo = null;
    if (country === "MX") {
      postalCode = postalCode.replace(/\D/g, "");
      if (postalCode.length === 4) postalCode = "0" + postalCode;
      geo = await lookupZip(postalCode);
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
        country,
        city: geo?.city || city || '',
        // Fuera de México el estado va tal cual lo escribió la clienta (ej. "TX", "CA")
        state: country === "MX" ? (geo?.state || toStateCode(state)) : String(state || "").trim().toUpperCase(),
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
          // Netlify corta la función a los 10 s: si una paquetería tarda, se descarta y no se queda "cargando"
          signal: AbortSignal.timeout(6000),
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

// Estado (código de 2 letras) y ciudad de un CP mexicano, según envia.com
async function lookupZip(cp) {
  if (!/^\d{5}$/.test(cp)) return null;
  try {
    const res = await fetch(`https://geocodes.envia.com/zipcode/MX/${cp}`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    const z = Array.isArray(data) ? data[0] : null;
    const state = z?.state?.code?.["2digit"];
    if (!state) return null;
    return { state, city: z.locality || z.city || "" };
  } catch {
    return null;
  }
}

function toStateCode(state) {
  if (!state) return '';
  // Sin acentos ni puntos: "Ciudad de México", "Edo. Méx." y "N.L." deben reconocerse igual
  const s = state.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").replace(/\s+/g, " ");
  // Códigos oficiales de envia.com (los mismos que da geocodes.envia.com)
  const map = {
    'aguascalientes':'AG','ags':'AG','baja california':'BC','baja california norte':'BC','bc':'BC',
    'baja california sur':'BS','bcs':'BS','campeche':'CM','camp':'CM','chiapas':'CS','chis':'CS',
    'chihuahua':'CH','chih':'CH','ciudad de mexico':'CX','cdmx':'CX','df':'CX','distrito federal':'CX',
    'coahuila':'CO','coahuila de zaragoza':'CO','coah':'CO','colima':'CL','col':'CL',
    'durango':'DG','dgo':'DG','guanajuato':'GT','gto':'GT','guerrero':'GR','gro':'GR',
    'hidalgo':'HG','hgo':'HG','jalisco':'JA','jal':'JA',
    'mexico':'EM','estado de mexico':'EM','edo mex':'EM','edo de mex':'EM','edomex':'EM','mex':'EM',
    'michoacan':'MI','michoacan de ocampo':'MI','mich':'MI','morelos':'MO','mor':'MO',
    'nayarit':'NA','nay':'NA','nuevo leon':'NL','nl':'NL','oaxaca':'OA','oax':'OA',
    'puebla':'PU','pue':'PU','queretaro':'QT','queretaro de arteaga':'QT','qro':'QT',
    'quintana roo':'QR','qroo':'QR','q roo':'QR','san luis potosi':'SL','slp':'SL',
    'sinaloa':'SI','sin':'SI','sonora':'SO','son':'SO','tabasco':'TB','tab':'TB',
    'tamaulipas':'TM','tamps':'TM','tams':'TM','tlaxcala':'TL','tlax':'TL',
    'veracruz':'VE','veracruz de ignacio de la llave':'VE','ver':'VE',
    'yucatan':'YU','yuc':'YU','zacatecas':'ZA','zac':'ZA',
  };
  return map[s] || state.trim().slice(0, 2).toUpperCase();
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
