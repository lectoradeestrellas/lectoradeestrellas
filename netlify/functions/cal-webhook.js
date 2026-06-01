// netlify/functions/cal-webhook.js
// Recibe webhooks de Cal.com cuando se crea una reserva y escribe en Google Sheets (pestaña Sesiones)
// Variables requeridas: GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_KEY
// Opcional: CAL_WEBHOOK_SECRET (para verificar que el webhook viene de Cal.com)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Verificar secret de Cal.com (opcional pero recomendado)
  const calSecret = process.env.CAL_WEBHOOK_SECRET;
  if (calSecret) {
    const signature = event.headers['x-cal-signature-256'];
    if (!signature) {
      return { statusCode: 401, body: 'Missing signature' };
    }
    const { createHmac } = require('crypto');
    const expected = createHmac('sha256', calSecret).update(event.body).digest('hex');
    if (signature !== `sha256=${expected}`) {
      return { statusCode: 401, body: 'Invalid signature' };
    }
  }

  let payload;
  try {
    const body = JSON.parse(event.body);
    // Cal.com envía { triggerEvent, payload } o directamente el payload
    payload = body.payload || body;
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Solo procesar reservas nuevas y reprogramadas
  const trigger = payload.triggerEvent || '';
  if (!['BOOKING_CREATED', 'BOOKING_RESCHEDULED'].includes(trigger) && trigger !== '') {
    return { statusCode: 200, body: 'Ignored event' };
  }

  try {
    const attendee = payload.attendees?.[0] || {};
    const eventType = payload.eventType || {};

    const sesionData = {
      fecha:       new Date().toLocaleString('es-MX', { timeZone: 'America/Monterrey' }),
      folio:       payload.uid || `CAL-${Date.now()}`,
      cliente:     attendee.name || payload.responses?.name?.value || 'N/A',
      email:       attendee.email || payload.responses?.email?.value || 'N/A',
      sesion:      eventType.title || payload.title || 'N/A',
      fechaSesion: payload.startTime
        ? new Date(payload.startTime).toLocaleString('es-MX', { timeZone: 'America/Monterrey' })
        : 'N/A',
      precio:      eventType.price ? `$${(eventType.price / 100).toFixed(0)} MXN` : 'Ver Cal.com',
      notas:       payload.responses?.notes?.value || payload.description || '',
      status:      trigger === 'BOOKING_RESCHEDULED' ? 'Reprogramada' : 'Confirmada',
      origen:      'Cal.com',
    };

    await writeToSesiones(sesionData);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Cal webhook error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

async function writeToSesiones(data) {
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

  if (!sheetsId || !serviceAccountKey.client_email) {
    console.warn('Google Sheets no configurado — omitiendo');
    return;
  }

  const token = await getGoogleToken(serviceAccountKey);

  const row = [
    data.fecha,
    data.folio,
    data.cliente,
    data.email,
    data.sesion,
    data.fechaSesion,
    data.precio,
    data.notas,
    data.status,
    data.origen,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Sesiones!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    throw new Error(`Sheets API: ${await res.text()}`);
  }
}

async function getGoogleToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const { createSign } = require('crypto');
  const signingInput = `${encode(header)}.${encode(claim)}`;
  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}
