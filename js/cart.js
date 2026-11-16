/**
 * STACKLY – Luxury Fashion Boutique
 * Cart Service (LocalStorage cart state, calculations, promo engine, and dynamic renderers)
 */

const CART_STORAGE_KEY = 'stackly_cart_v1';
const PROMO_STORAGE_KEY = 'stackly_promo_v1';
const FREE_SHIPPING_THRESHOLD = 250.00;
const STANDARD_SHIPPING_FEE = 25.00;
const TAX_RATE = 0.08; // 8% luxury sales tax

// Demo Coupon Codes as requested
const VALID_PROMOS = {
  'STACK10': { discountPercent: 10, label: 'STACK10 (10% Off)' },
  'STYLE15': { discountPercent: 15, label: 'STYLE15 (15% Off)' },
  'WELCOME20': { discountPercent: 20, label: 'WELCOME20 (20% Off)' },
  'STACKLYVIP': { discountPercent: 15, label: 'VIP Privilege (15% Off)' }
};

const CartService = {
  /**
   * Normalize and sanitize any incoming product object
   * Guarantees that title, price, categoryLabel, size, color and quantity are NEVER undefined or NaN
   */
  normalizeCartItem(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const id = raw.id != null ? Number(raw.id) : Date.now();
    let title = (raw.title || raw.name || 'Artisanal Silhouette').trim();
    if (!title || title.toLowerCase() === 'undefined' || title.toLowerCase() === 'null') {
      title = 'Artisanal Silhouette';
    }

    // Safely parse price
    let price = 0;
    if (typeof raw.price === 'number' && !isNaN(raw.price)) {
      price = raw.price;
    } else if (raw.price != null) {
      const clean = String(raw.price).replace(/[^0-9.]/g, '');
      price = parseFloat(clean) || 0;
    }

    let originalPrice = price;
    if (typeof raw.originalPrice === 'number' && !isNaN(raw.originalPrice)) {
      originalPrice = raw.originalPrice;
    } else if (raw.originalPrice != null) {
      const clean = String(raw.originalPrice).replace(/[^0-9.]/g, '');
      originalPrice = parseFloat(clean) || price;
    }

    let categoryLabel = (raw.categoryLabel || raw.category || raw.brand || 'Boutique Collection').trim();
    if (!categoryLabel || categoryLabel.toLowerCase() === 'undefined' || categoryLabel.toLowerCase() === 'null') {
      categoryLabel = 'Boutique Collection';
    }

    let thumbnail = raw.thumbnail || raw.image || (raw.images && raw.images[0]) || 'assets/images/hero-fashion-2.svg';
    if (!thumbnail || thumbnail === 'undefined' || thumbnail === 'null') {
      thumbnail = 'assets/images/hero-fashion-2.svg';
    }

    let size = (raw.size || 'M').trim();
    if (!size || size.toLowerCase() === 'undefined' || size.toLowerCase() === 'null') {
      size = 'M';
    }

    let color = (raw.color || 'Noir').trim();
    if (!color || color.toLowerCase() === 'undefined' || color.toLowerCase() === 'null') {
      color = 'Noir';
    }

    const quantity = Math.max(1, parseInt(raw.quantity, 10) || 1);

    return {
      id,
      title,
      price: Number(price.toFixed(2)),
      originalPrice: Number(originalPrice.toFixed(2)),
      categoryLabel,
      thumbnail,
      size,
      color,
      quantity
    };
  },

  getCart() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(item => this.normalizeCartItem(item)).filter(Boolean);
    } catch (e) {
      console.warn('LocalStorage error in getCart:', e);
      return [];
    }
  },

  saveCart(items) {
    try {
      const cleanItems = (items || []).map(item => this.normalizeCartItem(item)).filter(Boolean);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cleanItems));
    } catch (e) {
      console.warn('LocalStorage error in saveCart:', e);
    }
    this.updateBadges();
  },

  addToCart(product, size = 'M', color = 'Noir', quantity = 1) {
    if (!product) return [];

    let cart = this.getCart();
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const itemData = {
      ...product,
      size: size || product.size || 'M',
      color: color || product.color || 'Noir',
      quantity: qty
    };

    const normalized = this.normalizeCartItem(itemData);
    if (!normalized) return cart;

    const existingIndex = cart.findIndex(
      item => Number(item.id) === Number(normalized.id) && item.size === normalized.size && item.color === normalized.color
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push(normalized);
    }

    this.saveCart(cart);

    if (window.showToast) {
      window.showToast(`"${normalized.title}" added to your bag`, 'success');
    }

    // Refresh cart page if currently open
    if (document.getElementById('cart-page-container')) {
      this.renderCartPage();
    }

    this.renderMiniCart();
    return cart;
  },

  removeFromCart(id, size, color, silent = false) {
    let cart = this.getCart();
    const targetId = Number(id);
    const initialLen = cart.length;

    cart = cart.filter(item => {
      const matchId = Number(item.id) === targetId;
      if (!matchId) return true;
      if (size && color) {
        return !(item.size === size && item.color === color);
      }
      return false; // remove all with matching ID if size/color not specified
    });

    if (cart.length === initialLen) return;

    this.saveCart(cart);

    if (!silent && window.showToast) {
      window.showToast('Piece removed from your bag', 'info');
    }

    if (document.getElementById('cart-page-container')) {
      this.renderCartPage();
    }
    this.renderMiniCart();
  },

  moveToWishlist(id, size, color) {
    const cart = this.getCart();
    const targetId = Number(id);
    const item = cart.find(i => {
      const matchId = Number(i.id) === targetId;
      if (!matchId) return false;
      if (size && color) return i.size === size && i.color === color;
      return true;
    });

    if (!item) return;

    if (window.WishlistService) {
      window.WishlistService.toggleWishlist({
        id: item.id,
        title: item.title,
        price: item.price,
        originalPrice: item.originalPrice,
        categoryLabel: item.categoryLabel,
        thumbnail: item.thumbnail
      });
    }

    // Silent remove from cart so only ONE toast appears
    this.removeFromCart(id, size, color, true);

    if (window.showToast) {
      window.showToast(`"${item.title}" moved to your Wishlist`, 'success');
    }
  },

  updateQuantity(id, size, color, newQuantity) {
    let cart = this.getCart();
    const targetId = Number(id);
    const item = cart.find(i => {
      const matchId = Number(i.id) === targetId;
      if (!matchId) return false;
      if (size && color) return i.size === size && i.color === color;
      return true;
    });

    if (!item) return;

    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      this.removeFromCart(id, size, color);
      return;
    }

    item.quantity = qty;
    this.saveCart(cart);

    if (document.getElementById('cart-page-container')) {
      this.renderCartPage();
    }
    this.renderMiniCart();
  },

  clearCart() {
    this.saveCart([]);
    this.removePromo();
    if (document.getElementById('cart-page-container')) {
      this.renderCartPage();
    }
    this.renderMiniCart();
    if (window.showToast) {
      window.showToast(`Your shopping bag has been cleared`, 'info');
    }
  },

  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  },

  getCartSubtotal() {
    const cart = this.getCart();
    if (!cart || cart.length === 0) return 0;
    const subtotal = cart.reduce((sum, item) => {
      const p = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
      const q = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1;
      return sum + (p * q);
    }, 0);
    return Number(subtotal.toFixed(2));
  },

  getAppliedPromo() {
    try {
      const stored = localStorage.getItem(PROMO_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  },

  applyPromo(code) {
    if (!code || !code.trim()) {
      if (window.showToast) {
        window.showToast('Please enter a valid coupon code.', 'error');
      }
      return { success: false, message: 'Please enter a coupon code.' };
    }

    const cleanCode = code.trim().toUpperCase();

    if (VALID_PROMOS[cleanCode]) {
      const promoData = {
        code: cleanCode,
        discountPercent: VALID_PROMOS[cleanCode].discountPercent,
        label: VALID_PROMOS[cleanCode].label
      };
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promoData));
      if (window.showToast) {
        window.showToast(`Coupon "${cleanCode}" applied: ${promoData.discountPercent}% discount!`, 'success');
      }
      if (document.getElementById('cart-page-container')) {
        this.renderCartPage();
      }
      return { success: true, message: `Coupon "${cleanCode}" applied successfully.` };
    } else {
      if (window.showToast) {
        window.showToast(`Invalid coupon code. Try STACK10, STYLE15, or WELCOME20`, 'error');
      }
      return { success: false, message: 'Invalid coupon code. Try STACK10, STYLE15, or WELCOME20' };
    }
  },

  removePromo() {
    localStorage.removeItem(PROMO_STORAGE_KEY);
    if (window.showToast) {
      window.showToast(`Coupon code removed`, 'info');
    }
    if (document.getElementById('cart-page-container')) {
      this.renderCartPage();
    }
  },

  getOrderCalculations() {
    const subtotal = this.getCartSubtotal();
    const promo = this.getAppliedPromo();
    const discountPercent = promo ? promo.discountPercent : 0;
    const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
    const shippingFee = (subtotal === 0 || qualifiesForFreeShipping) ? 0 : STANDARD_SHIPPING_FEE;
    const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const shippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

    const taxAmount = subtotal === 0 ? 0 : Number((discountedSubtotal * TAX_RATE).toFixed(2));
    const total = subtotal === 0 ? 0 : Number((discountedSubtotal + shippingFee + taxAmount).toFixed(2));

    return {
      subtotal,
      discountPercent,
      discountAmount,
      promo,
      qualifiesForFreeShipping,
      freeShippingRemaining,
      shippingProgress,
      shippingFee,
      taxAmount,
      total
    };
  },

  updateBadges() {
    const count = this.getCartCount();
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(b => {
      b.textContent = count;
      if (count > 0) {
        b.classList.remove('hidden');
        b.classList.add('badge-pop');
        setTimeout(() => b.classList.remove('badge-pop'), 350);
      } else {
        b.classList.add('hidden');
      }
    });
  },

  renderCartPage() {
    const container = document.getElementById('cart-page-container');
    if (!container) return;

    const cart = this.getCart();
    const calc = this.getOrderCalculations();

    // 1. EMPTY CART STATE
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="empty-cart-view" data-aos="fade-up">
          <div class="empty-cart-illustration">
            <img src="assets/images/empty-cart.svg" alt="Empty Shopping Bag" width="160" height="160">
          </div>
          <h2 class="empty-cart-title cinema-title">YOUR BAG IS WAITING FOR SOMETHING SPECIAL.</h2>
          <p class="empty-cart-text sentence-cascade">Explore our latest collections and find timeless pieces to elevate your wardrobe.</p>
          <div class="empty-cart-actions">
            <a href="index.html#new-arrivals" class="btn btn-primary btn-lg">
              <span>Continue Shopping</span>
              <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      `;
      this.initCartPageDelegation();
      return;
    }

    // 2. SHIPPING PROGRESS
    let shippingText = '';
    if (calc.qualifiesForFreeShipping) {
      shippingText = `<i class="fa-solid fa-circle-check text-gold"></i> You've unlocked <strong>Complimentary Worldwide Shipping</strong>!`;
    } else {
      shippingText = `<i class="fa-solid fa-plane-up text-gold"></i> Add <strong>$${calc.freeShippingRemaining.toFixed(2)}</strong> more to qualify for <strong>Complimentary Shipping</strong>.`;
    }

    // 3. CART ITEMS LIST (Left Column)
    let itemsHtml = '';
    cart.forEach((item, index) => {
      const unitPrice = Number(item.price).toFixed(2);
      const lineTotal = (item.price * item.quantity).toFixed(2);
      itemsHtml += `
        <div class="cart-product-item" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}" style="animation-delay: ${index * 60}ms;">
          <div class="cart-item-image-box">
            <img src="${item.thumbnail}" alt="${item.title}" onerror="this.src='assets/images/hero-fashion-2.svg'">
          </div>

          <div class="cart-item-main-details">
            <div class="cart-item-header">
              <span class="cart-item-category-label">${item.categoryLabel}</span>
              <h3 class="cart-item-name">${item.title}</h3>
              <div class="cart-item-attributes">
                <span class="attr-chip">Size: <strong>${item.size}</strong></span>
                <span class="attr-chip">Color: <strong>${item.color}</strong></span>
              </div>
            </div>

            <div class="cart-item-pricing-row">
              <div class="cart-item-unit-price">
                <span class="price-label">Price:</span>
                <span class="price-val">$${unitPrice}</span>
              </div>

              <div class="cart-qty-control">
                <button type="button" class="cart-stepper-btn qty-decrease" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}" aria-label="Decrease quantity">
                  <i class="fa-solid fa-minus"></i>
                </button>
                <input type="number" class="cart-stepper-input qty-input" value="${item.quantity}" min="1" max="99" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}" readonly>
                <button type="button" class="cart-stepper-btn qty-increase" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}" aria-label="Increase quantity">
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>

              <div class="cart-item-line-total">
                <span class="total-label">Subtotal:</span>
                <span class="total-val">$${lineTotal}</span>
              </div>
            </div>

            <div class="cart-item-bottom-actions">
              <button type="button" class="item-action-link move-to-wishlist-action" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}">
                <i class="fa-regular fa-heart"></i>
                <span>Move to Wishlist</span>
              </button>
              <button type="button" class="item-action-link remove-item-action" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}">
                <i class="fa-solid fa-xmark"></i>
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    // 4. COUPON BOX
    let promoHtml = '';
    if (calc.promo) {
      promoHtml = `
        <div class="active-coupon-badge">
          <div class="coupon-tag-info">
            <i class="fa-solid fa-tag"></i>
            <span>${calc.promo.label}</span>
          </div>
          <button type="button" id="remove-promo-btn" class="remove-coupon-cross" title="Remove coupon">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;
    } else {
      promoHtml = `
        <form id="promo-code-form" class="coupon-box-form">
          <div class="coupon-input-wrap">
            <input type="text" id="promo-input" placeholder="Coupon code (e.g. STACK10)" aria-label="Enter coupon code">
            <button type="submit" class="btn btn-dark btn-sm">Apply</button>
          </div>
          <div class="coupon-demo-pills">
            <span class="demo-pill" data-code="STACK10">STACK10 (10%)</span>
            <span class="demo-pill" data-code="STYLE15">STYLE15 (15%)</span>
            <span class="demo-pill" data-code="WELCOME20">WELCOME20 (20%)</span>
          </div>
        </form>
      `;
    }

    // 5. ASSEMBLE TWO-COLUMN LAYOUT
    container.innerHTML = `
      <div class="cart-two-column-layout">
        <div class="cart-items-column">
          <div class="shipping-threshold-banner">
            <div class="shipping-banner-text">
              ${shippingText}
            </div>
            <div class="shipping-progress-track">
              <div class="shipping-progress-fill" style="width: ${calc.shippingProgress}%"></div>
            </div>
          </div>

          <div class="cart-items-stack" id="cart-items-stack">
            ${itemsHtml}
          </div>

          <div class="cart-items-footer-actions">
            <a href="index.html#new-arrivals" class="btn-text-gold">
              <i class="fa-solid fa-arrow-left"></i>
              <span>Continue Shopping</span>
            </a>
            <button type="button" id="clear-cart-btn" class="btn-text-danger">
              <i class="fa-solid fa-trash-can"></i>
              <span>Clear Shopping Bag</span>
            </button>
          </div>
        </div>

        <aside class="cart-summary-column">
          <div class="luxury-summary-card">
            <h2 class="summary-card-title cinema-title">Order Summary</h2>

            <div class="summary-coupon-section">
              <span class="coupon-section-label">Promotional Privilege</span>
              ${promoHtml}
            </div>

            <div class="summary-breakdown-rows">
              <div class="summary-calc-row">
                <span class="calc-label">Subtotal</span>
                <span class="calc-value">$${calc.subtotal.toFixed(2)}</span>
              </div>

              ${calc.discountAmount > 0 ? `
              <div class="summary-calc-row discount-applied-row">
                <span class="calc-label">Privilege Discount (${calc.discountPercent}%)</span>
                <span class="calc-value">-$${calc.discountAmount.toFixed(2)}</span>
              </div>` : ''}

              <div class="summary-calc-row">
                <span class="calc-label">Estimated Shipping</span>
                <span class="calc-value">${calc.shippingFee === 0 ? '<strong class="text-gold">FREE</strong>' : `$${calc.shippingFee.toFixed(2)}`}</span>
              </div>

              <div class="summary-calc-row">
                <span class="calc-label">Estimated Tax (8%)</span>
                <span class="calc-value">$${calc.taxAmount.toFixed(2)}</span>
              </div>

              <div class="summary-separator-line"></div>

              <div class="summary-calc-row summary-grand-total">
                <span class="calc-label">Final Total</span>
                <span class="calc-value grand-total-amount">$${calc.total.toFixed(2)}</span>
              </div>
            </div>

            <div class="summary-buttons-stack">
              <a href="checkout.html" class="btn btn-primary btn-block btn-lg" id="proceed-checkout-btn">
                <span>Proceed to Checkout</span>
                <i class="fa-solid fa-lock"></i>
              </a>
              <a href="index.html#new-arrivals" class="btn btn-outline btn-block">
                <span>Continue Shopping</span>
              </a>
            </div>

            <div class="boutique-guarantees">
              <div class="guarantee-item">
                <i class="fa-solid fa-shield-halved"></i>
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
              <div class="guarantee-item">
                <i class="fa-solid fa-rotate-left"></i>
                <span>30-Day Complimentary Boutique Returns</span>
              </div>
              <div class="guarantee-item">
                <i class="fa-solid fa-certificate"></i>
                <span>100% Certified Authentic Luxury</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    `;

    this.initCartPageDelegation();
  },

  /**
   * Event Delegation on #cart-page-container
   * Attached ONCE to avoid duplicate listeners on re-renders
   */
  initCartPageDelegation() {
    const container = document.getElementById('cart-page-container');
    if (!container || container._hasCartDelegation) return;

    container._hasCartDelegation = true;

    container.addEventListener('click', (e) => {
      // 1. Remove Item
      const removeBtn = e.target.closest('.remove-item-action');
      if (removeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = removeBtn.getAttribute('data-id');
        const size = removeBtn.getAttribute('data-size');
        const color = removeBtn.getAttribute('data-color');
        const itemCard = removeBtn.closest('.cart-product-item');

        if (itemCard) {
          itemCard.classList.add('removing');
          setTimeout(() => {
            this.removeFromCart(id, size, color);
          }, 240);
        } else {
          this.removeFromCart(id, size, color);
        }
        return;
      }

      // 2. Quantity Increase
      const incBtn = e.target.closest('.qty-increase');
      if (incBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = incBtn.getAttribute('data-id');
        const size = incBtn.getAttribute('data-size');
        const color = incBtn.getAttribute('data-color');
        const input = container.querySelector(`.qty-input[data-id="${id}"][data-size="${size}"][data-color="${color}"]`);
        const currentVal = input ? (parseInt(input.value, 10) || 1) : 1;
        this.updateQuantity(id, size, color, currentVal + 1);
        return;
      }

      // 3. Quantity Decrease
      const decBtn = e.target.closest('.qty-decrease');
      if (decBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = decBtn.getAttribute('data-id');
        const size = decBtn.getAttribute('data-size');
        const color = decBtn.getAttribute('data-color');
        const input = container.querySelector(`.qty-input[data-id="${id}"][data-size="${size}"][data-color="${color}"]`);
        const currentVal = input ? (parseInt(input.value, 10) || 1) : 1;
        this.updateQuantity(id, size, color, currentVal - 1);
        return;
      }

      // 4. Move to Wishlist
      const wishBtn = e.target.closest('.move-to-wishlist-action');
      if (wishBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = wishBtn.getAttribute('data-id');
        const size = wishBtn.getAttribute('data-size');
        const color = wishBtn.getAttribute('data-color');
        const itemCard = wishBtn.closest('.cart-product-item');

        if (itemCard) {
          itemCard.classList.add('removing');
          setTimeout(() => {
            this.moveToWishlist(id, size, color);
          }, 240);
        } else {
          this.moveToWishlist(id, size, color);
        }
        return;
      }

      // 5. Clear Cart
      const clearBtn = e.target.closest('#clear-cart-btn');
      if (clearBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you wish to clear all pieces from your shopping bag?')) {
          this.clearCart();
        }
        return;
      }

      // 6. Demo Coupon Pill
      const demoPill = e.target.closest('.demo-pill');
      if (demoPill) {
        e.preventDefault();
        e.stopPropagation();
        const code = demoPill.getAttribute('data-code');
        this.applyPromo(code);
        return;
      }

      // 7. Remove Coupon
      const removePromoBtn = e.target.closest('#remove-promo-btn');
      if (removePromoBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.removePromo();
        return;
      }
    });

    container.addEventListener('submit', (e) => {
      const promoForm = e.target.closest('#promo-code-form');
      if (promoForm) {
        e.preventDefault();
        e.stopPropagation();
        const input = document.getElementById('promo-input');
        const val = input ? input.value.trim() : '';

        let errorContainer = promoForm.querySelector('.cart-coupon-error');
        if (!errorContainer) {
          errorContainer = document.createElement('div');
          errorContainer.className = 'form-error-msg coupon-error-msg cart-coupon-error';
          promoForm.appendChild(errorContainer);
        }

        if (!val) {
          errorContainer.textContent = 'Please enter a coupon code (e.g. STACK10).';
          errorContainer.style.display = 'block';
          if (window.showToast) window.showToast('Please enter a coupon code.', 'error');
          return;
        }

        const res = this.applyPromo(val);
        if (!res.success) {
          errorContainer.textContent = res.message;
          errorContainer.style.display = 'block';
        } else {
          errorContainer.textContent = '';
          errorContainer.style.display = 'none';
        }
      }
    });
  },

  renderMiniCart() {
    const container = document.getElementById('mini-cart-items');
    const subtotalElem = document.getElementById('mini-cart-subtotal');
    if (!container) return;

    const cart = this.getCart();
    const subtotal = this.getCartSubtotal();

    if (subtotalElem) {
      subtotalElem.textContent = `$${subtotal.toFixed(2)}`;
    }

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="drawer-empty-state">
          <div class="empty-icon-wrap">
            <i class="fa-solid fa-bag-shopping"></i>
          </div>
          <h3>Your Bag is Empty</h3>
          <p>Explore the seasonal runway edit and discover your signature pieces.</p>
          <a href="index.html#new-arrivals" class="btn btn-primary btn-sm close-cart-drawer">Discover Pieces</a>
        </div>
      `;
      this.initMiniCartDelegation();
      return;
    }

    let html = '';
    cart.forEach(item => {
      const lineTotal = (item.price * item.quantity).toFixed(2);
      html += `
        <div class="drawer-item" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}">
          <div class="drawer-item-img">
            <img src="${item.thumbnail}" alt="${item.title}" onerror="this.src='assets/images/hero-fashion-2.svg'">
          </div>
          <div class="drawer-item-details">
            <span class="drawer-item-cat">${item.categoryLabel}</span>
            <h4 class="drawer-item-title">${item.title}</h4>
            <div class="drawer-item-meta">Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}</div>
            <div class="drawer-item-price">$${lineTotal}</div>
            <div class="drawer-item-actions">
              <button type="button" class="btn-remove-item remove-mini-cart-item" data-id="${item.id}" data-size="${item.size}" data-color="${item.color}">
                <i class="fa-solid fa-xmark"></i> Remove
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.initMiniCartDelegation();
  },

  initMiniCartDelegation() {
    const container = document.getElementById('mini-cart-items');
    if (!container || container._hasMiniCartDelegation) return;

    container._hasMiniCartDelegation = true;

    container.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-mini-cart-item');
      if (removeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = removeBtn.getAttribute('data-id');
        const size = removeBtn.getAttribute('data-size');
        const color = removeBtn.getAttribute('data-color');
        const itemCard = removeBtn.closest('.drawer-item');

        if (itemCard) {
          itemCard.classList.add('removing');
          setTimeout(() => {
            this.removeFromCart(id, size, color);
          }, 200);
        } else {
          this.removeFromCart(id, size, color);
        }
      }

      const closeLink = e.target.closest('.close-cart-drawer');
      if (closeLink) {
        this.closeDrawer();
      }
    });
  },

  openDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('drawer-overlay');
    this.renderMiniCart();
    if (drawer && overlay) {
      drawer.classList.add('open');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  },

  init() {
    this.updateBadges();

    if (document.getElementById('cart-page-container')) {
      this.renderCartPage();
    }

    document.querySelectorAll('.open-cart-drawer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const isCartPage = window.location.pathname.includes('cart.html');
        if (!isCartPage && document.getElementById('cart-drawer')) {
          e.preventDefault();
          this.openDrawer();
        }
      });
    });

    const closeBtn = document.getElementById('close-cart-drawer');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }
  }
};

window.CartService = CartService;
