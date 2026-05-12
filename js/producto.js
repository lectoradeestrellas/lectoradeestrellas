/* ============================================================
   LECTORA DE ESTRELLAS — Shared Product Page Logic
   ============================================================ */

let qty = 1;
let currentImages = [];
let currentImgIndex = 0;
let reviewRating = 0;
let CURRENT_PRODUCT = null;

// ── Gallery ───────────────────────────────────────────────
function initGallery(images) {
  currentImages = images;
  currentImgIndex = 0;
  renderThumbs();
  setMainImage(images[0], 0);
}

function renderThumbs() {
  const container = document.getElementById('gallery-thumbs');
  if (!container) return;
  container.innerHTML = currentImages.map((src, i) => `
    <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="setMainImage('${src}', ${i})">
      <img src="${src}" alt="" loading="lazy" onerror="this.src='images/placeholder.jpg'">
    </div>`).join('');
}

function setMainImage(src, index) {
  currentImgIndex = index;
  const img = document.getElementById('main-img');
  if (!img) return;
  img.style.opacity = '0.4';
  setTimeout(() => { img.src = src; img.style.opacity = '1'; img.style.transition = 'opacity 0.2s'; }, 120);
  document.querySelectorAll('.gallery-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
  // Update zoom
  const zoomImg = document.getElementById('zoom-img');
  if (zoomImg) zoomImg.src = src;
}

function prevImg() {
  const next = (currentImgIndex - 1 + currentImages.length) % currentImages.length;
  setMainImage(currentImages[next], next);
}

function nextImg() {
  const next = (currentImgIndex + 1) % currentImages.length;
  setMainImage(currentImages[next], next);
}

function openZoom() {
  document.getElementById('zoom-overlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeZoom() {
  document.getElementById('zoom-overlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeZoom();
  if (e.key === 'ArrowLeft') prevImg();
  if (e.key === 'ArrowRight') nextImg();
});

// ── Quantity ──────────────────────────────────────────────
function changeQty(delta) {
  qty = Math.max(1, Math.min(10, qty + delta));
  const el = document.getElementById('qty-display');
  if (el) el.textContent = qty;
}

// ── Add to Cart (simple product) ─────────────────────────
function addToCart() {
  if (!CURRENT_PRODUCT) return;
  for (let i = 0; i < qty; i++) {
    Cart.add({
      id: CURRENT_PRODUCT.id,
      name: CURRENT_PRODUCT.name,
      price: CURRENT_PRODUCT.price,
      image: currentImages[0] || 'images/placeholder.jpg',
      sku: CURRENT_PRODUCT.sku || '',
    });
  }
  flashAddBtn();
}

function flashAddBtn() {
  const btn = document.getElementById('add-btn');
  if (!btn) return;
  const original = btn.innerHTML;
  btn.innerHTML = '✦ Agregado al carrito';
  btn.classList.add('added');
  setTimeout(() => { btn.innerHTML = original; btn.classList.remove('added'); }, 2500);
}

// ── Accordion ─────────────────────────────────────────────
function toggleDetail(btn) {
  btn.classList.toggle('open');
  btn.nextElementSibling?.classList.toggle('open');
}

// ── Reviews ───────────────────────────────────────────────
function loadReviews(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function renderReviews(reviewsKey, productName) {
  const section = document.getElementById('reviews-section');
  if (!section) return;

  const reviews = loadReviews(reviewsKey);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const avgDisplay = avg.toFixed(1);
  const fullStars = Math.round(avg);

  section.innerHTML = `
    <div class="reviews-header">
      <div>
        <h2>Reseñas</h2>
        <div class="rating-summary">
          <span class="stars">${'★'.repeat(fullStars)}${'☆'.repeat(5 - fullStars)}</span>
          <span class="rating-num">${reviews.length > 0 ? avgDisplay + ' · ' : ''}${reviews.length} reseña${reviews.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>

    <div id="reviews-list">
      ${reviews.length === 0
        ? `<p style="color:var(--ink-soft);font-size:0.95rem;margin-bottom:1.5rem">Aún no hay reseñas. ¡Sé la primera en compartir tu experiencia! ✦</p>`
        : reviews.map(r => {
          const initials = r.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
          return `
            <div class="review-card">
              <div class="review-header">
                <div class="reviewer-info">
                  <div class="reviewer-avatar">${initials}</div>
                  <div>
                    <div class="reviewer-name">${r.name}</div>
                    <div class="review-date">${r.variant ? r.variant + ' · ' : ''}${r.date}</div>
                  </div>
                </div>
                <div class="stars" style="font-size:0.95rem">${stars}</div>
              </div>
              <div class="review-body">${r.text}</div>
            </div>`;
        }).join('')
      }
    </div>

    <div class="write-review">
      <h3>Deja tu reseña ✦</h3>
      <p class="subtitle">¿Ya tienes tu producto? Comparte tu experiencia.</p>

      <div class="star-selector" id="star-selector">
        <span data-val="1">★</span><span data-val="2">★</span>
        <span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Nombre</label>
          <input class="form-input" type="text" id="reviewer-name" placeholder="Tu nombre">
        </div>
        <div class="form-field">
          <label class="form-label">Email (no se publica)</label>
          <input class="form-input" type="email" id="reviewer-email" placeholder="tu@email.com">
        </div>
      </div>

      <textarea class="review-textarea" id="review-text" placeholder="Cuéntanos tu experiencia..."></textarea>

      <button class="btn btn-primary" onclick="submitReview('${reviewsKey}')">Publicar reseña ✦</button>
    </div>`;

  // Init star selector
  initStarSelector();
}

function initStarSelector() {
  reviewRating = 0;
  document.querySelectorAll('#star-selector span').forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val);
      document.querySelectorAll('#star-selector span').forEach((s, i) => s.classList.toggle('lit', i < val));
    });
    star.addEventListener('click', () => {
      reviewRating = parseInt(star.dataset.val);
      document.querySelectorAll('#star-selector span').forEach((s, i) => s.classList.toggle('lit', i < reviewRating));
    });
  });
  document.getElementById('star-selector')?.addEventListener('mouseleave', () => {
    document.querySelectorAll('#star-selector span').forEach((s, i) => s.classList.toggle('lit', i < reviewRating));
  });
}

function submitReview(reviewsKey, variantLabel) {
  const name = document.getElementById('reviewer-name')?.value.trim();
  const text = document.getElementById('review-text')?.value.trim();

  if (!name || !text || !reviewRating) {
    alert('Por favor completa tu nombre, calificación y reseña.');
    return;
  }

  const reviews = loadReviews(reviewsKey);
  reviews.unshift({
    name, text,
    rating: reviewRating,
    variant: variantLabel || '',
    date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
  });
  localStorage.setItem(reviewsKey, JSON.stringify(reviews));
  renderReviews(reviewsKey);
}

// ── Init (simple product, no variants) ───────────────────
function initProductPage(data) {
  CURRENT_PRODUCT = data;
  document.addEventListener('DOMContentLoaded', () => {
    initGallery(data.images || [data.image]);
    renderReviews(data.reviewsKey, data.name);
  });
}
