# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static e-commerce website for **Lectora de Estrellas**, an astrology brand (Andrea Hinojosa) selling physical notebooks, planners, prints, and digital products. Deployed on Netlify with serverless functions for payments and shipping.

## Deployment

- **Platform**: Netlify — `netlify.toml` at root sets `publish = "."` and `functions = "netlify/functions"`
- No build step. Changes to HTML/CSS/JS files deploy directly.
- Netlify Functions (Node.js) live in `netlify/functions/`: `create-payment-intent.js`, `order-confirm.js`, `shipping.js`

## File Structure

The `css/` subfolder is a reorganized/updated version of the site. The root-level HTML pages are the currently served version. When in doubt, the `css/` folder represents the more up-to-date structure:

```
css/
  css/styles.css          ← main design system (CSS custom properties)
  css/producto.css        ← product page styles
  js/main.js              ← Cart, Nav, Newsletter, Reveal, Checkout modules
  js/products.js          ← single source of truth for all product data
  js/producto.js          ← shared product page logic (gallery, reviews)
  netlify/functions/      ← serverless functions (Stripe, shipping, order confirm)
  index.html + all pages
images/                   ← product photos (named by product ID)
```

## Architecture

### JavaScript Modules (`css/js/`)

**`products.js`** — `window.PRODUCTS` is the single source of truth for all product data. Edit here to update product names, prices, images, and descriptions across the entire site. `window.CATEGORIES` maps category IDs to display labels.

**`main.js`** — Four IIFE modules initialized on `DOMContentLoaded`:
- `Cart` — localStorage-backed (`lde_cart` key), renders a slide-in sidebar
- `Nav` — scroll shadow, hamburger toggle, active link highlighting
- `Newsletter` — Formspree POST (replace `YOUR_FORM_ID`)
- `Reveal` — IntersectionObserver scroll-reveal for `[data-reveal]` elements

**`producto.js`** — Shared across all product detail pages. Manages image gallery with zoom, quantity selector, add-to-cart, accordion details, and a localStorage-based review system.

### Design System (`css/css/styles.css`)

All visual tokens are CSS custom properties on `:root`. Key variables:
- Colors: `--ink`, `--parchment`, `--cream`, `--plum`, `--deep-plum`, `--gold`, `--midnight`
- Fonts: `--font-display` (Cinzel), `--font-body` (Cormorant Garamond), `--font-ui` (DM Sans)
- Gradients: `--grad-hero`, `--grad-warm`, `--grad-cosmic`, `--grad-banner`

### Netlify Functions

- `create-payment-intent.js` — creates a Stripe PaymentIntent (MXN), reads `STRIPE_SECRET_KEY` from env
- `order-confirm.js` — post-payment order confirmation
- `shipping.js` — shipping rates/labels via envia.com API, reads `ENVIA_API_KEY` from env

## Required Configurations (not yet set)

| Location | Placeholder | What to replace with |
|---|---|---|
| `css/js/main.js` line ~166 | `YOUR_FORM_ID` | Formspree form ID |
| `css/js/main.js` line ~233 | `pk_test_YOUR_STRIPE_KEY` | Stripe publishable key |
| `sesiones.html` | `https://cal.com/lectoradeestrellas/lectura-natal` | Real Cal.com booking links |

Netlify environment variables needed: `STRIPE_SECRET_KEY`, `ENVIA_API_KEY`, `PAYPAL_CLIENT_ID`

## Third-party Integrations

- **Stripe** — payments via PaymentIntent flow + Netlify function
- **Formspree** — newsletter and contact forms
- **Cal.com** — booking for 1:1 astrology sessions
- **envia.com** — shipping rates and labels (MX)

## Adding or Updating Products

1. Add the product object to `css/js/products.js` in `PRODUCTS`
2. Add product images to `images/productos/` following the naming convention `{product-id}-1.jpg`, `{product-id}-2.jpg`, etc.
3. Create or update the corresponding product detail HTML page
