/* ============================================================
   LECTORA DE ESTRELLAS — Charts Manager
   Handles saving and loading birth charts from Supabase.
   Include in carta-astral.html and mi-cuenta.html
   ============================================================ */

const SUPABASE_URL = 'https://bvohupycpzbmkqyzgjup.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2b2h1cHljcHpibWtxeXpnanVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI3NjgsImV4cCI6MjA5NjQxODc2OH0.umbGX48cmi0Gob62dpipDH9YN7n74dFI0rVNnuCrFV4';

// Initialize Supabase client (reuses existing if already loaded)
function getSupabase() {
  if (window._supabaseClient) return window._supabaseClient;
  window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return window._supabaseClient;
}

// ── Save a chart ──────────────────────────────────────────
async function saveChart({ chartName, birthName, birthDate, birthTime, birthPlace, birthLat, birthLng, chartData }) {
  const client = getSupabase();
  const { data: { session } } = await client.auth.getSession();

  if (!session) {
    return { error: 'Necesitas iniciar sesión para guardar cartas.' };
  }

  const { data, error } = await client
    .from('user_charts')
    .insert({
      user_id:    session.user.id,
      email:      session.user.email,
      chart_name: chartName,
      birth_name: birthName || null,
      birth_date: birthDate,
      birth_time: birthTime || null,
      birth_place: birthPlace,
      birth_lat:  birthLat || null,
      birth_lng:  birthLng || null,
      chart_data: chartData || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

// ── Load all charts for current user ─────────────────────
async function loadCharts() {
  const client = getSupabase();
  const { data: { session } } = await client.auth.getSession();

  if (!session) return { error: 'No session', charts: [] };

  const { data, error } = await client
    .from('user_charts')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message, charts: [] };
  return { charts: data || [] };
}

// ── Load a single chart by ID ─────────────────────────────
async function loadChart(chartId) {
  const client = getSupabase();
  const { data, error } = await client
    .from('user_charts')
    .select('*')
    .eq('id', chartId)
    .single();

  if (error) return { error: error.message };
  return { chart: data };
}

// ── Delete a chart ────────────────────────────────────────
async function deleteChart(chartId) {
  const client = getSupabase();
  const { error } = await client
    .from('user_charts')
    .delete()
    .eq('id', chartId);

  if (error) return { error: error.message };
  return { success: true };
}

// ── Check if user is logged in ────────────────────────────
async function getCurrentUser() {
  const client = getSupabase();
  const { data: { session } } = await client.auth.getSession();
  return session?.user || null;
}

// Export to window
window.ChartsManager = { saveChart, loadCharts, loadChart, deleteChart, getCurrentUser };
