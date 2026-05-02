# Lectora de Estrellas — Sitio Web

## 🚀 Cómo subir a GitHub y publicar en Netlify

### Paso 1 — Crear repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Click en el botón verde **"New"** (arriba a la izquierda)
3. Nombre del repositorio: `lectoradeestrellas`
4. Déjalo en **Public**
5. Click **"Create repository"**

### Paso 2 — Subir los archivos

En la página del repositorio vacío verás instrucciones. Haz click en **"uploading an existing file"** (el link azul en el centro).

Arrastra TODA esta carpeta y espera a que cargue. Luego click **"Commit changes"**.

### Paso 3 — Conectar con Netlify

1. Ve a [app.netlify.com](https://app.netlify.com) e inicia sesión
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"GitHub"** y autoriza si te pide permiso
4. Selecciona el repositorio `lectoradeestrellas`
5. En "Site name" escribe: `lectoradeestrellas`
6. Click **"Deploy site"**

¡Listo! En 1-2 minutos tu sitio estará en `lectoradeestrellas.netlify.app`

---

## 📸 Agregar tus imágenes

Sube tus fotos a la carpeta `images/` con estos nombres exactos:

| Archivo | Dónde se usa |
|---|---|
| `hero-agendas.jpg` | Imagen principal del hero |
| `agenda-lunar-2026-hero.jpg` | Card principal de la colección |
| `diario-lunar-2026.jpg` | Card del diario |
| `calendario-mini-lunar.jpg` | Card del calendario |
| `print-calendario-lunar.jpg` | Card del print |
| `libreta-mistica.jpg` | Card producto |
| `libreta-as-above.jpg` | Card producto |
| `diarios-zodiacales.jpg` | Card producto |
| `libreta-fases-lunares.jpg` | Card producto |
| `lecturas-astrales.jpg` | Card de servicio |
| `tienda-libretas.jpg` | Card de servicio |
| `aprende-webinars.jpg` | Card de servicio |
| `andrea-portrait.jpg` | Foto de Andrea |
| `evento-beltane.jpg` | Card del evento |
| `blog-saturno-aries.jpg` | Card del blog |
| `blog-temporada-geminis.jpg` | Card del blog |
| `blog-temporada-aries.jpg` | Card del blog |

**Tamaño recomendado:** 1200×800px mínimo, formato JPG o WebP, menos de 500kb por imagen.

---

## 🔑 Variables de entorno (configura en Netlify)

En Netlify → Site settings → Environment variables, agrega:

| Variable | Valor |
|---|---|
| `STRIPE_SECRET_KEY` | Tu clave secreta de Stripe |
| `ENVIA_API_KEY` | Tu API key de envia.com |
| `PAYPAL_CLIENT_ID` | Tu Client ID de PayPal |

---

## 📧 Formulario de contacto (Formspree)

1. Ve a [formspree.io](https://formspree.io) y crea cuenta gratis
2. Crea un nuevo form
3. Copia tu Form ID (algo como `xpzvjqwk`)
4. En `js/main.js` busca `YOUR_FORM_ID` y reemplázalo con el tuyo

---

## 📅 Booking (Cal.com)

1. Ve a [cal.com](https://cal.com) y crea cuenta gratis
2. Crea tus tipos de eventos (Lectura Natal, Kármica, etc.)
3. En `sesiones.html` los botones "Reservar ahora" apuntan a tu link de Cal.com
4. Reemplaza `https://cal.com/lectoradeestrellas/lectura-natal` con tus links reales

---

## Páginas incluidas

- `index.html` — Homepage ✅
- `tienda.html` — Tienda con carrito (próxima entrega)
- `sesiones.html` — Sesiones 1:1 (próxima entrega)
- `eventos.html` — Eventos (próxima entrega)
- `aprende.html` — Cursos (próxima entrega)
- `blog.html` — Blog (próxima entrega)
- `checkout.html` — Checkout con Stripe (próxima entrega)
