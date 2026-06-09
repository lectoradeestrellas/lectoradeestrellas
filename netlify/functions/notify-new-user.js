// netlify/functions/notify-new-user.js
// Recibe webhook de Supabase cuando se registra una nueva usuaria
// y manda notificación por email via Formspree.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    const user = payload.record;
    const email = user?.email || 'Email no disponible';
    const nombre = user?.raw_user_meta_data?.nombre || '';
    const apellido = user?.raw_user_meta_data?.apellido || '';
    const fullName = nombre && apellido ? `${nombre} ${apellido}` : (nombre || 'No proporcionado');
    const createdAt = user?.created_at
      ? new Date(user.created_at).toLocaleString('es-MX', { timeZone: 'America/Monterrey' })
      : 'Fecha no disponible';

    const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT;
    if (!formspreeEndpoint) {
      console.error('FORMSPREE_ENDPOINT not configured');
      return { statusCode: 500, body: 'Formspree not configured' };
    }

    const response = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _subject: `✦ Nueva cuenta registrada — ${email}`,
        message: `
Nueva usuaria registrada en Lectora de Estrellas

Nombre: ${fullName}
Email: ${email}
Fecha de registro: ${createdAt}

---
Ver en Supabase:
https://supabase.com/dashboard/project/bvohupycpzbmkqyzgjup/auth/users
        `.trim(),
        email,
        nombre: fullName,
        fecha: createdAt,
      }),
    });

    if (!response.ok) {
      console.error('Formspree error:', await response.text());
      return { statusCode: 500, body: 'Failed to send notification' };
    }

    console.log(`✓ New user notification sent for: ${email}`);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('Notify new user error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
