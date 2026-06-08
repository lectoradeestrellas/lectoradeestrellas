// netlify/functions/cal-webhook.js
// Recibe webhooks de Cal.com cuando alguien reserva una sesión
// y guarda la sesión en Supabase automáticamente.
//
// Configuración en Cal.com:
// Settings → Developer → Webhooks → Add webhook
// URL: https://lectoradeestrellas.netlify.app/.netlify/functions/cal-webhook
// Events: BOOKING_CREATED, BOOKING_CANCELLED

const { createClient } = require('@supabase/supabase-js');

// Map Cal.com event slugs to readable session names
const SESSION_NAMES = {
  'natal':           'Lectura Natal',
  'karmica':         'Lectura Kármica',
  'ciclo-anual':     'Ciclo Anual',
  'momento-actual':  'Momento Actual',
  'encrucijada':     'Encrucijada',
  'tirada-express':  'Tirada Express',
  'guia-del-alma':   'Guía del Alma',
  'tirada-camino':   'Tirada de Camino',
  'guia-del-anio':   'Guía del Año',
};

const SESSION_PRICES = {
  'natal':           1000,
  'karmica':         1000,
  'ciclo-anual':     1000,
  'momento-actual':  1000,
  'encrucijada':     1200,
  'tirada-express':  300,
  'guia-del-alma':   700,
  'tirada-camino':   700,
  'guia-del-anio':   700,
};

const SESSION_DURATIONS = {
  'natal':           '90 min',
  'karmica':         '90 min',
  'ciclo-anual':     '90 min',
  'momento-actual':  '90 min',
  'encrucijada':     '90 min',
  'tirada-express':  '30 min',
  'guia-del-alma':   '60 min',
  'tirada-camino':   '60 min',
  'guia-del-anio':   '60 min',
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    const { triggerEvent, payload: booking } = payload;

    // Only process booking created and cancelled events
    if (!['BOOKING_CREATED', 'BOOKING_CANCELLED'].includes(triggerEvent)) {
      return { statusCode: 200, body: 'Event ignored' };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const email = booking?.attendees?.[0]?.email || booking?.email;
    if (!email) {
      console.error('No email found in Cal.com webhook payload');
      return { statusCode: 400, body: 'No email found' };
    }

    // Get event slug from the booking
    const eventSlug = booking?.eventType?.slug || booking?.eventSlug || '';
    const sessionType = SESSION_NAMES[eventSlug] || booking?.eventType?.title || 'Sesión';

    if (triggerEvent === 'BOOKING_CREATED') {
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          email,
          session_type:    sessionType,
          session_date:    booking?.startTime || null,
          duration:        SESSION_DURATIONS[eventSlug] || null,
          price:           SESSION_PRICES[eventSlug] || null,
          status:          'Confirmada',
          cal_booking_id:  String(booking?.uid || booking?.id || ''),
          recording_url:   null, // Andrea adds this manually after the session
          summary_url:     null, // Andrea adds this manually after the session
          notes:           null,
        });

      if (error) {
        console.error('Supabase insert error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }

      console.log(`✓ Session saved: ${email} → ${sessionType}`);
    }

    if (triggerEvent === 'BOOKING_CANCELLED') {
      const calBookingId = String(booking?.uid || booking?.id || '');
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ status: 'Cancelada' })
        .eq('cal_booking_id', calBookingId);

      if (error) {
        console.error('Supabase update error:', error);
      }

      console.log(`✓ Session cancelled: ${calBookingId}`);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('Cal webhook error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
