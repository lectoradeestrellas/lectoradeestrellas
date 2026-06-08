/* ============================================================
   LECTORA DE ESTRELLAS — Auth Guard
   Include this script in any page that requires login or product access.
   
   Usage:
   1. For login-only pages:
      <script src="js/auth-guard.js" data-require="login"></script>
   
   2. For product-specific pages:
      <script src="js/auth-guard.js" data-require="producto" data-product-id="curso-venus"></script>
   ============================================================ */

(function() {
  const SUPABASE_URL = 'https://bvohupycpzbmkqyzgjup.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2b2h1cHljcHpibWtxeXpnanVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI3NjgsImV4cCI6MjA5NjQxODc2OH0.umbGX48cmi0Gob62dpipDH9YN7n74dFI0rVNnuCrFV4';

  // Get script attributes
  const script = document.currentScript;
  const require = script?.getAttribute('data-require') || 'login';
  const productId = script?.getAttribute('data-product-id');

  // Hide page content until auth check completes
  document.documentElement.style.visibility = 'hidden';

  // Load Supabase SDK dynamically if not already loaded
  function loadSupabase(callback) {
    if (window.supabase) { callback(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = callback;
    document.head.appendChild(s);
  }

  loadSupabase(async () => {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { session } } = await client.auth.getSession();

    if (!session) {
      // Not logged in — redirect to login
      const currentPage = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?redirect=${currentPage}`;
      return;
    }

    if (require === 'producto' && productId) {
      // Check product access
      const { data } = await client
        .from('user_access')
        .select('id')
        .eq('email', session.user.email)
        .eq('product_id', productId)
        .eq('active', true)
        .single();

      if (!data) {
        // No access — redirect to purchase page
        window.location.href = `/aprende.html?noaccess=${productId}`;
        return;
      }
    }

    // Auth passed — show page
    document.documentElement.style.visibility = 'visible';
  });
})();
