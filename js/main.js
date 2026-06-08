/* ============================================================
   LECTORA DE ESTRELLAS — Cart & UI Logic
   ============================================================ */

// ── Cart State ───────────────────────────────────────────
const Cart = (() => {
  let items = JSON.parse(localStorage.getItem('lde_cart') || '[]');

  const save = () => localStorage.setItem('lde_cart', JSON.stringify(items));

  const updateCount = () => {
    const total = items.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = total;
      el.classList.toggle('visible', total > 0);
    });
  };

  const add = (product) => {
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ ...product, qty: 1 });
    }
    save();
    updateCount();
    renderSidebar();
    openSidebar();
  };

  const remove = (id) => {
    items = items.filter(i => i.id !== id);
    save();
    updateCount();
    renderSidebar();
  };

  const changeQty = (id, delta) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) items = items.filter(i => i.id !== id);
    save();
    updateCount();
    renderSidebar();
  };

  const getTotal = () => items.reduce((s, i) => s + i.price * i.qty, 0);

  const renderSidebar = () => {
    const container = document.getElementById('cart-items');
    const footer = document.getElementById('cart-footer');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="star">✦</div>
          <p>Tu carrito está vacío.<br>Explora nuestras herramientas mágicas.</p>
        </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    container.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-img">
          <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.name}" loading="lazy">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="Cart.changeQty('${item.id}', -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="Cart.changeQty('${item.id}', 1)">+</button>
        </div>
      </div>
    `).join('');

    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.textContent = `$${getTotal().toFixed(2)} MXN`;
  };

  const openSidebar = () => {
    document.getElementById('cart-overlay')?.classList.add('open');
    document.getElementById('cart-sidebar')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.getElementById('cart-sidebar')?.classList.remove('open');
    document.body.style.overflow = '';
  };

  const init = () => {
    updateCount();
    renderSidebar();

    document.getElementById('cart-overlay')?.addEventListener('click', closeSidebar);
    document.getElementById('cart-close')?.addEventListener('click', closeSidebar);
    document.querySelectorAll('.cart-btn').forEach(btn => {
      btn.addEventListener('click', openSidebar);
    });
  };

  return { add, remove, changeQty, getTotal, init, openSidebar, closeSidebar, items: () => items };
})();

// ── Navigation ───────────────────────────────────────────
const Nav = (() => {
  const init = () => {
    // Scroll shadow
    const nav = document.querySelector('.nav');
    if (nav) {
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 10);
      }, { passive: true });
    }

    // Mobile menu
    function openMobileMenu() {
      document.getElementById('mobile-menu')?.classList.add('open');
      document.getElementById('mobile-overlay')?.classList.add('open');
      document.querySelector('.nav-hamburger')?.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeMobileMenu() {
      document.getElementById('mobile-menu')?.classList.remove('open');
      document.getElementById('mobile-overlay')?.classList.remove('open');
      document.querySelector('.nav-hamburger')?.classList.remove('open');
      document.body.style.overflow = '';
    }
    document.querySelector('.nav-hamburger')?.addEventListener('click', () => {
      document.getElementById('mobile-menu')?.classList.contains('open')
        ? closeMobileMenu() : openMobileMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobileMenu(); });
    window.openMobileMenu = openMobileMenu;
    window.closeMobileMenu = closeMobileMenu;

    // Active link
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-menu-nav a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === current || (current === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });
  };

  return { init };
})();

// ── Newsletter ───────────────────────────────────────────
const Newsletter = (() => {
  const init = () => {
    document.querySelectorAll('.newsletter-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const btn = form.querySelector('.btn');
        const email = input?.value.trim();
        if (!email) return;

        const originalText = btn.textContent;
        btn.textContent = 'Enviando...';
        btn.disabled = true;

        // Using Formspree — replace with your endpoint
        try {
          const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email, _subject: 'Nueva suscripción newsletter' })
          });
          if (res.ok) {
            btn.textContent = '¡Gracias! ✦';
            input.value = '';
            setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 3000);
          } else {
            throw new Error();
          }
        } catch {
          btn.textContent = 'Intenta de nuevo';
          btn.disabled = false;
          setTimeout(() => { btn.textContent = originalText; }, 2000);
        }
      });
    });
  };

  return { init };
})();

// ── Scroll Reveal ────────────────────────────────────────
const Reveal = (() => {
  const init = () => {
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      el.style.transitionDelay = el.dataset.delay || '0ms';
      observer.observe(el);
    });

    document.addEventListener('revealed-add', () => {
      document.querySelectorAll('.revealed').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    });

    // Trigger for already-observed
    setTimeout(() => {
      document.querySelectorAll('[data-reveal].revealed').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }, 50);
  };

  return { init };
})();

// ── Stripe Checkout ──────────────────────────────────────
const Checkout = (() => {
  // Replace with your Stripe publishable key
  const STRIPE_PK = 'pk_test_YOUR_STRIPE_KEY';

  const proceedToCheckout = async () => {
    const items = Cart.items();
    if (items.length === 0) return;

    // For now, redirect to a simple checkout page
    // In production, this calls your Netlify function to create a Stripe session
    window.location.href = 'checkout.html';
  };

  return { proceedToCheckout };
})();

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  Cart.init();
  Newsletter.init();
  Reveal.init();

  // Redirect "Mi cuenta" links to mi-cuenta.html if user has an active session
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (key) {
      const session = JSON.parse(localStorage.getItem(key));
      if (session && session.access_token) {
        ['nav-account-link', 'mobile-account-link'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.href = 'mi-cuenta.html';
        });
      }
    }
  } catch(e) {}
});

// Expose globally
window.Cart = Cart;
window.Checkout = Checkout;
