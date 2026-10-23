// netlify/functions/cal-webhook.js
// Recibe webhooks de Cal.com cuando alguien reserva una sesión
// y guarda la sesión en Supabase automáticamente.
//
// Configuración en Cal.com:
// Settings → Developer → Webhooks → Add webhook
// URL: https://lectoradeestrellas.com/.netlify/functions/cal-webhook
// Events: BOOKING_CREATED, BOOKING_CANCELLED

const { createClient } = require('@supabase/supabase-js');
const { writeToTab } = require('./lib/order-processing');

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

    // Cal.com manda el slug del evento en `type` (ej. "natal") y el título en `eventTitle`
    const eventSlug = (booking?.type || booking?.eventType?.slug || booking?.eventSlug || '').toLowerCase();
    const sessionType = SESSION_NAMES[eventSlug] || booking?.eventTitle || booking?.eventType?.title || 'Sesión';
    const duration = SESSION_DURATIONS[eventSlug] || (booking?.length ? `${booking.length} min` : null);
    const price = SESSION_PRICES[eventSlug] || null;

    if (!SESSION_NAMES[eventSlug]) {
      console.warn(`Slug de Cal.com no reconocido: "${eventSlug}" (eventTitle: ${booking?.eventTitle})`);
    }

    if (triggerEvent === 'BOOKING_CREATED') {
      try {
        const { error } = await supabase
          .from('user_sessions')
          .insert({
            email,
            session_type:    sessionType,
            session_date:    booking?.startTime || null,
            duration:        duration,
            price:           price,
            status:          'Confirmada',
            cal_booking_id:  String(booking?.uid || booking?.id || ''),
            cal_booking_url: booking?.metadata?.videoCallUrl ||
                             booking?.references?.[0]?.meetingUrl ||
                             `https://cal.com/booking/${booking?.uid}` || null,
            meeting_url:     booking?.videoCallUrl ||
                             booking?.metadata?.videoCallUrl || null,
            recording_url:   null, // Andrea adds this manually after the session
            summary_url:     null, // Andrea adds this manually after the session
            notes:           null,
          });

        if (error) throw new Error(error.message);

        console.log(`✓ Session saved: ${email} → ${sessionType}`);
      } catch (supaErr) {
        console.error('Supabase insert error:', supaErr.message);
        // No bloqueamos el flujo si Supabase falla
      }

      // Guardar en Google Sheets — pestaña Sesiones
      try {
        // Extraer respuestas de las preguntas de Cal.com
        // Busca la respuesta por identificador o por la etiqueta de la pregunta,
        // así funciona aunque en Cal.com el identificador sea distinto
        const responses = booking?.responses || {};
        const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const findResponse = (...keywords) => {
          for (const [key, entry] of Object.entries(responses)) {
            const haystack = normalize(`${key} ${entry?.label || ''}`);
            if (keywords.every((k) => haystack.includes(k))) {
              const value = entry && typeof entry === 'object' ? entry.value : entry;
              if (value) return typeof value === 'object' ? JSON.stringify(value) : String(value);
            }
          }
          return '';
        };
        // La fecha llega en tres preguntas: Día, Mes y Año de nacimiento
        const fechaNacimiento = [
          findResponse('dia', 'naci'),
          findResponse('mes', 'naci'),
          findResponse('ano', 'naci'),
        ].filter(Boolean).join('/') || findResponse('fecha', 'naci');
        const birthData = [
          fechaNacimiento,
          findResponse('hora', 'naci'),
          findResponse('lugar', 'naci') || findResponse('ciudad', 'naci'),
        ].filter(Boolean).join(' · ');
        const ciudadActual = findResponse('ciudad', 'actual') || findResponse('pais', 'actual');
        const motivo = findResponse('inquietud') || findResponse('motivo');

        if (!birthData || !ciudadActual) {
          console.warn('Respuestas de Cal.com recibidas:', JSON.stringify(responses));
        }

        await writeToTab(null, 'Sesiones', [
          new Date().toLocaleString('es-MX', { timeZone: 'America/Monterrey' }),
          booking?.startTime ? new Date(booking.startTime).toLocaleString('es-MX', { timeZone: 'America/Monterrey' }) : '',
          booking?.attendees?.[0]?.name || '',
          email,
          sessionType,
          duration || '',
          price ? `$${price}` : '',
          'stripe',
          'Google Meet',
          birthData,
          ciudadActual,
          'Confirmada',
          motivo,                  // Notas
        ]);
        console.log('✓ Session saved to Google Sheets');
      } catch (sheetsErr) {
        console.error('Google Sheets error:', sheetsErr.message);
        // No bloqueamos el flujo si Sheets falla
      }
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
