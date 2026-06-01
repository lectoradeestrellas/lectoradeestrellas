// netlify/functions/rsvp.js
// Recibe RSVP de eventos.html y escribe fila en Google Sheets (pestaña RSVPs)
// Variables requeridas: GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_KEY

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { nombre, apellido, email, evento, fechaEvento, lugar } = data;
  if (!nombre || !apellido || !email || !evento) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltan campos requeridos' }) };
  }

  const row = [
    new Date().toLocaleString('es-MX', { timeZone: 'America/Monterrey' }),
    nombre,
    apellido,
    email,
    evento,
    fechaEvento || '',
    lugar || '',
  ];

  try {
    await writeToSheets(row);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('RSVP Sheets error:', err.message);
    // Retornamos 200 para que la UI no muestre error al usuario
    // (el RSVP se recibió aunque no se guardó en Sheets)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, sheetsError: err.message }),
    };
  }
};

async function writeToSheets(row) {
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

  if (!sheetsId || !serviceAccountKey.client_email) {
    console.warn('Google Sheets no configurado — omitiendo');
    return;
  }

  const token = await getGoogleToken(serviceAccountKey);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/RSVPs!A:G:append?valueInputOption=USER_ENTERED`,
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
  const tokenData = await res.json();
  return tokenData.access_token;
}
