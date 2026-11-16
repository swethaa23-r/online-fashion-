/**
 * STACKLY – Luxury Fashion Boutique
 * Checkout Controller (Indian validation rules, demo payments, live calculations, and order persistence)
 */

document.addEventListener('DOMContentLoaded', () => {
  const checkoutContainer = document.getElementById('checkout-page-container');
  if (!checkoutContainer) return;

  CheckoutController.init();
});

const CheckoutController = {
  selectedDeliveryMethod: 'standard', // 'standard' or 'express'
  selectedPaymentMethod: 'cod',       // 'cod', 'upi', 'card'
  standardDeliveryFee: 15.00,
  expressDeliveryFee: 35.00,
  isSubmitting: false,

  init() {
    this.verifyCartState();
    this.renderOrderSummary();
    this.setupDeliveryOptions();
    this.setupPaymentMethods();
    this.setupLiveValidation();
    this.setupFormSubmission();
    this.setupCardFormatters();
    this.setupPromoCodeCheckout();
  },

  /**
   * Check if cart is empty. If so, display empty state and block checkout.
   */
  verifyCartState() {
    const cart = window.CartService ? window.CartService.getCart() : [];
    if (cart.length === 0) {
      const container = document.getElementById('checkout-page-container');
      if (container) {
        container.innerHTML = `
          <div class="container">
            <div class="empty-checkout-card luxury-empty-state" data-aos="fade-up" style="max-width: 650px; margin: 3rem auto; text-align: center; padding: 4rem 2rem;">
              <div class="empty-state-icon-box" style="width: 72px; height: 72px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(182, 154, 101, 0.12); color: var(--color-gold); font-size: 2rem;">
                <i class="fa-solid fa-bag-shopping"></i>
              </div>
              <span class="empty-state-capsule" style="display: inline-block; font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--color-gold); margin-bottom: 0.75rem; font-weight: 600;">SHOPPING BAG EMPTY</span>
              <h2 class="empty-checkout-heading" style="font-family: var(--font-serif); font-size: clamp(1.8rem, 3vw, 2.4rem); letter-spacing: 0.05em; color: var(--color-charcoal); margin-bottom: 1rem;">YOUR BAG IS WAITING FOR SOMETHING SPECIAL.</h2>
              <p class="empty-checkout-desc" style="max-width: 500px; margin: 0 auto 2rem; color: var(--color-grey-dark); font-size: 0.95rem; line-height: 1.7;">You do not have any curated pieces in your shopping bag to complete an order. Explore our latest silhouettes to begin.</p>
              <div class="empty-state-button-row" style="display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                <a href="index.html" class="btn btn-primary btn-lg">
                  <span>Explore Boutique Collection</span>
                  <i class="fa-solid fa-arrow-right"></i>
                </a>
              </div>
            </div>
          </div>
        `;
      }
      const placeBtn = document.getElementById('place-order-btn');
      if (placeBtn) placeBtn.disabled = true;
    }
  },

  /**
   * Render Live Order Review on the Right Column
   */
  renderOrderSummary() {
    const itemsContainer = document.getElementById('checkout-items-list');
    const totalsContainer = document.getElementById('checkout-totals-summary');
    if (!itemsContainer || !totalsContainer) return;

    const cart = window.CartService ? window.CartService.getCart() : [];
    const baseCalc = window.CartService ? window.CartService.getOrderCalculations() : null;

    if (!baseCalc) return;

    // Determine delivery fee
    let deliveryFee = this.standardDeliveryFee;
    let deliveryLabel = 'Standard Delivery';

    if (this.selectedDeliveryMethod === 'express') {
      deliveryFee = this.expressDeliveryFee;
      deliveryLabel = 'Express Priority Delivery';
    } else {
      if (baseCalc.qualifiesForFreeShipping) {
        deliveryFee = 0;
        deliveryLabel = 'Standard Delivery (Complimentary)';
      } else {
        deliveryFee = this.standardDeliveryFee;
        deliveryLabel = 'Standard Delivery';
      }
    }

    const discountedSubtotal = Math.max(0, baseCalc.subtotal - baseCalc.discountAmount);
    const taxAmount = Number((discountedSubtotal * 0.08).toFixed(2));
    const grandTotal = Number((discountedSubtotal + deliveryFee + taxAmount).toFixed(2));

    // 1. Render Product Items with images, names, selected quantities, and unit prices
    let itemsHtml = '';
    cart.forEach(item => {
      const lineSubtotal = (item.price * item.quantity).toFixed(2);
      itemsHtml += `
        <div class="checkout-review-item">
          <div class="checkout-item-thumb">
            <img src="${item.thumbnail}" alt="${item.title}" onerror="this.src='assets/images/hero-fashion-2.svg'">
            <span class="checkout-qty-bubble">${item.quantity}</span>
          </div>
          <div class="checkout-item-details">
            <h4 class="checkout-item-title">${item.title}</h4>
            <span class="checkout-item-submeta">${item.size} / ${item.color}</span>
            <span class="checkout-item-unitprice">Unit: $${Number(item.price).toFixed(2)}</span>
          </div>
          <div class="checkout-item-totalprice">
            $${lineSubtotal}
          </div>
        </div>
      `;
    });
    itemsContainer.innerHTML = itemsHtml;

    // 2. Render Financial Summary breakdown
    totalsContainer.innerHTML = `
      <div class="summary-breakdown-row">
        <span class="row-label">Subtotal (${window.CartService.getCartCount()} items)</span>
        <span class="row-value">$${baseCalc.subtotal.toFixed(2)}</span>
      </div>

      ${baseCalc.discountAmount > 0 ? `
      <div class="summary-breakdown-row discount-row">
        <span class="row-label">Coupon Discount (${baseCalc.promo ? baseCalc.promo.code : ''})</span>
        <span class="row-value">-$${baseCalc.discountAmount.toFixed(2)}</span>
      </div>` : ''}

      <div class="summary-breakdown-row">
        <span class="row-label">${deliveryLabel}</span>
        <span class="row-value">${deliveryFee === 0 ? '<strong class="text-gold">FREE</strong>' : `$${deliveryFee.toFixed(2)}`}</span>
      </div>

      <div class="summary-breakdown-row">
        <span class="row-label">Estimated Tax (8%)</span>
        <span class="row-value">$${taxAmount.toFixed(2)}</span>
      </div>

      <div class="summary-divider-line"></div>

      <div class="summary-breakdown-row grand-total-row">
        <span class="row-label">Final Amount</span>
        <span class="row-value final-total-price">$${grandTotal.toFixed(2)}</span>
      </div>
    `;

    this.currentTotal = grandTotal;
    this.currentDeliveryFee = deliveryFee;
    this.currentDeliveryLabel = deliveryLabel;
    this.discountAmount = baseCalc.discountAmount;
    this.subtotalAmount = baseCalc.subtotal;
  },

  /**
   * Delivery Options Selection (Standard vs Express)
   */
  setupDeliveryOptions() {
    const radioInputs = document.querySelectorAll('input[name="delivery_method"]');
    radioInputs.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.selectedDeliveryMethod = e.target.value;
        this.renderOrderSummary();

        document.querySelectorAll('.delivery-option-card').forEach(card => {
          card.classList.remove('active');
        });
        const currentCard = e.target.closest('.delivery-option-card');
        if (currentCard) currentCard.classList.add('active');
      });
    });
  },

  /**
   * Payment Methods Tabs (Cash on Delivery, UPI Demo, Card Demo)
   */
  setupPaymentMethods() {
    const methodCards = document.querySelectorAll('.payment-method-selector');
    const tabPanels = document.querySelectorAll('.payment-method-panel');

    methodCards.forEach(card => {
      card.addEventListener('click', () => {
        const method = card.getAttribute('data-method');
        this.selectedPaymentMethod = method;

        methodCards.forEach(c => c.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        card.classList.add('active');
        const activeRadio = card.querySelector('input[type="radio"]');
        if (activeRadio) activeRadio.checked = true;

        const panel = document.getElementById(`payment-panel-${method}`);
        if (panel) panel.classList.add('active');
      });
    });
  },

  /**
   * Card auto-formatting for demo simulation
   */
  setupCardFormatters() {
    const cardNum = document.getElementById('card-number');
    const cardExp = document.getElementById('card-expiry');
    const cardCvv = document.getElementById('card-cvv');
    const cardBrand = document.getElementById('card-brand-icon');

    if (cardNum) {
      cardNum.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 16);
        e.target.value = val.match(/.{1,4}/g)?.join(' ') || val;

        const g = cardNum.closest('.form-group');
        if (g && val.length >= 15) {
          g.classList.remove('has-error');
          const err = g.querySelector('.form-error-msg');
          if (err) err.textContent = '';
        }

        if (cardBrand) {
          if (val.startsWith('4')) {
            cardBrand.className = 'fa-brands fa-cc-visa text-gold';
          } else if (/^5[1-5]/.test(val)) {
            cardBrand.className = 'fa-brands fa-cc-mastercard text-gold';
          } else {
            cardBrand.className = 'fa-solid fa-credit-card';
          }
        }
      });
    }

    if (cardExp) {
      cardExp.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (val.length >= 2) {
          e.target.value = `${val.slice(0, 2)} / ${val.slice(2)}`;
        } else {
          e.target.value = val;
        }

        const g = cardExp.closest('.form-group');
        if (g && val.length === 4) {
          g.classList.remove('has-error');
          const err = g.querySelector('.form-error-msg');
          if (err) err.textContent = '';
        }
      });
    }

    if (cardCvv) {
      cardCvv.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
        const g = cardCvv.closest('.form-group');
        if (g && e.target.value.length === 3) {
          g.classList.remove('has-error');
          const err = g.querySelector('.form-error-msg');
          if (err) err.textContent = '';
        }
      });
    }
  },

  /**
   * Coupon code in Checkout sidebar (100% script-based error rendering)
   */
  setupPromoCodeCheckout() {
    const form = document.getElementById('checkout-promo-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('checkout-promo-input');
      const val = input ? input.value.trim() : '';

      let errorContainer = form.querySelector('.checkout-coupon-error');
      if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'form-error-msg coupon-error-msg checkout-coupon-error';
        form.appendChild(errorContainer);
      }

      if (!val) {
        errorContainer.textContent = 'Please enter a coupon code (e.g. STACK10).';
        errorContainer.style.display = 'block';
        if (window.showToast) window.showToast('Please enter a coupon code.', 'error');
        return;
      }

      if (window.CartService) {
        const res = window.CartService.applyPromo(val);
        if (!res.success) {
          errorContainer.textContent = res.message;
          errorContainer.style.display = 'block';
        } else {
          errorContainer.textContent = '';
          errorContainer.style.display = 'none';
          this.renderOrderSummary();
          input.value = '';
        }
      }
    });
  },

  /**
   * Real-time Validation handlers (Email, 10-digit Indian mobile, 6-digit PIN code)
   */
  setupLiveValidation() {
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email-address');
    const phoneInput = document.getElementById('phone-number');
    const addressInput = document.getElementById('street-address');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const pinInput = document.getElementById('pin-code');

    const inputs = [fullNameInput, emailInput, phoneInput, addressInput, cityInput, stateInput, pinInput];

    inputs.forEach(input => {
      if (!input) return;

      input.addEventListener('input', () => {
        this.validateSingleField(input);
      });

      input.addEventListener('blur', () => {
        this.validateSingleField(input);
      });
    });

    // Enforce digit-only for phone & PIN code
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      });
    }

    if (pinInput) {
      pinInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
      });
    }
  },

  validateSingleField(input) {
    if (!input) return true;
    const group = input.closest('.form-group');
    const val = input.value.trim();
    let isValid = true;
    let message = '';

    switch (input.id) {
      case 'full-name':
        if (!val || val.length < 3) {
          isValid = false;
          message = 'Please enter your complete full name.';
        }
        break;

      case 'email-address':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!val || !emailRegex.test(val)) {
          isValid = false;
          message = 'Please enter a valid email address (e.g. name@domain.com).';
        }
        break;

      case 'phone-number':
        // 10-digit Indian mobile number validation (starts with 6,7,8,9)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!val || !phoneRegex.test(val)) {
          isValid = false;
          message = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
        }
        break;

      case 'street-address':
        if (!val || val.length < 5) {
          isValid = false;
          message = 'Please provide your full street address or house number.';
        }
        break;

      case 'city':
        if (!val) {
          isValid = false;
          message = 'City is required.';
        }
        break;

      case 'state':
        if (!val) {
          isValid = false;
          message = 'State / Region is required.';
        }
        break;

      case 'pin-code':
        // 6-digit Indian PIN Code validation
        const pinRegex = /^\d{6}$/;
        if (!val || !pinRegex.test(val)) {
          isValid = false;
          message = 'Please enter a valid 6-digit PIN code (e.g. 110001, 400001, 560001).';
        }
        break;

      default:
        if (input.hasAttribute('required') && !val) {
          isValid = false;
          message = 'This field is required.';
        }
        break;
    }

    if (!isValid) {
      if (group) {
        group.classList.add('has-error');
        let errElem = group.querySelector('.form-error-msg');
        if (!errElem) {
          errElem = document.createElement('span');
          errElem.className = 'form-error-msg';
          group.appendChild(errElem);
        }
        errElem.textContent = message;
      }
    } else {
      if (group) {
        group.classList.remove('has-error');
        const errElem = group.querySelector('.form-error-msg');
        if (errElem) errElem.textContent = '';
      }
    }

    return isValid;
  },

  validateFullForm() {
    const requiredInputs = [
      document.getElementById('full-name'),
      document.getElementById('email-address'),
      document.getElementById('phone-number'),
      document.getElementById('street-address'),
      document.getElementById('city'),
      document.getElementById('state'),
      document.getElementById('pin-code')
    ];

    let allValid = true;
    let firstInvalid = null;

    requiredInputs.forEach(input => {
      const valid = this.validateSingleField(input);
      if (!valid) {
        allValid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    // Check payment-specific demo validations
    if (this.selectedPaymentMethod === 'upi') {
      const upiInput = document.getElementById('demo-upi-id');
      if (upiInput) {
        const upiVal = upiInput.value.trim();
        const upiRegex = /^[\w.-]+@[\w.-]+$/;
        const group = upiInput.closest('.form-group');
        if (!upiVal || !upiRegex.test(upiVal)) {
          allValid = false;
          if (group) {
            group.classList.add('has-error');
            let errElem = group.querySelector('.form-error-msg');
            if (!errElem) {
              errElem = document.createElement('span');
              errElem.className = 'form-error-msg';
              group.appendChild(errElem);
            }
            errElem.textContent = 'Please enter a valid UPI ID (e.g. username@okhdfcbank).';
          }
          if (!firstInvalid) firstInvalid = upiInput;
        } else {
          if (group) {
            group.classList.remove('has-error');
            const errElem = group.querySelector('.form-error-msg');
            if (errElem) errElem.textContent = '';
          }
        }
      }
    }

    if (this.selectedPaymentMethod === 'card') {
      const cardNum = document.getElementById('card-number');
      const cardExp = document.getElementById('card-expiry');
      const cardCvv = document.getElementById('card-cvv');

      if (cardNum) {
        const rawNum = cardNum.value.replace(/\D/g, '');
        const g = cardNum.closest('.form-group');
        if (rawNum.length < 15) {
          allValid = false;
          if (g) {
            g.classList.add('has-error');
            let errElem = g.querySelector('.form-error-msg');
            if (!errElem) {
              errElem = document.createElement('span');
              errElem.className = 'form-error-msg';
              g.appendChild(errElem);
            }
            errElem.textContent = 'Please enter a valid 15-16 digit card number.';
          }
          if (!firstInvalid) firstInvalid = cardNum;
        } else if (g) {
          g.classList.remove('has-error');
          const errElem = g.querySelector('.form-error-msg');
          if (errElem) errElem.textContent = '';
        }
      }

      if (cardExp) {
        const expVal = cardExp.value.trim();
        const g = cardExp.closest('.form-group');
        if (!/^\d{2}\s*\/\s*\d{2}$/.test(expVal)) {
          allValid = false;
          if (g) {
            g.classList.add('has-error');
            let errElem = g.querySelector('.form-error-msg');
            if (!errElem) {
              errElem = document.createElement('span');
              errElem.className = 'form-error-msg';
              g.appendChild(errElem);
            }
            errElem.textContent = 'Please enter expiration date (MM / YY).';
          }
          if (!firstInvalid) firstInvalid = cardExp;
        } else if (g) {
          g.classList.remove('has-error');
          const errElem = g.querySelector('.form-error-msg');
          if (errElem) errElem.textContent = '';
        }
      }

      if (cardCvv) {
        const cvvVal = cardCvv.value.trim();
        const g = cardCvv.closest('.form-group');
        if (cvvVal.length < 3) {
          allValid = false;
          if (g) {
            g.classList.add('has-error');
            let errElem = g.querySelector('.form-error-msg');
            if (!errElem) {
              errElem = document.createElement('span');
              errElem.className = 'form-error-msg';
              g.appendChild(errElem);
            }
            errElem.textContent = 'Please enter a 3-digit CVV.';
          }
          if (!firstInvalid) firstInvalid = cardCvv;
        } else if (g) {
          g.classList.remove('has-error');
          const errElem = g.querySelector('.form-error-msg');
          if (errElem) errElem.textContent = '';
        }
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return allValid;
  },

  /**
   * Handle Order Submission
   */
  setupFormSubmission() {
    const form = document.getElementById('checkout-main-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check empty cart
      const cart = window.CartService ? window.CartService.getCart() : [];
      if (cart.length === 0) {
        if (window.showToast) {
          window.showToast('Your shopping bag is empty. Please add items before placing order.', 'error');
        }
        return;
      }

      // Prevent duplicate submission
      if (this.isSubmitting) return;

      // Validate all required fields
      if (!this.validateFullForm()) {
        if (window.showToast) {
          window.showToast('Please correct the highlighted fields with valid information.', 'error');
        }
        return;
      }

      this.isSubmitting = true;
      const submitBtn = document.getElementById('place-order-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="luxury-spinner"></span>
        <span>Securing Your Order...</span>
      `;

      // Customer payload
      const customerData = {
        fullName: document.getElementById('full-name').value.trim(),
        email: document.getElementById('email-address').value.trim(),
        phone: document.getElementById('phone-number').value.trim(),
        address: document.getElementById('street-address').value.trim(),
        landmark: (document.getElementById('apartment-landmark')?.value || '').trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        pinCode: document.getElementById('pin-code').value.trim(),
        country: document.getElementById('country').value,
        paymentMethod: this.getPaymentMethodLabel(this.selectedPaymentMethod),
        deliveryMethod: this.currentDeliveryLabel
      };

      // Generate Unique Order ID: STK-2026-XXXXXX
      const orderId = 'STK-' + Math.floor(100000 + Math.random() * 900000);
      const orderDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const orderRecord = {
        orderId,
        orderDate,
        customer: customerData,
        items: cart,
        subtotal: this.subtotalAmount,
        discount: this.discountAmount,
        deliveryFee: this.currentDeliveryFee,
        totalAmount: this.currentTotal,
        paymentMethod: customerData.paymentMethod,
        deliveryMethod: customerData.deliveryMethod
      };

      // Store in LocalStorage order history
      try {
        const history = JSON.parse(localStorage.getItem('stackly_order_history') || '[]');
        history.unshift(orderRecord);
        localStorage.setItem('stackly_order_history', JSON.stringify(history));
      } catch (err) {
        console.warn('LocalStorage order history error:', err);
      }

      // Simulate secure order placement gateway
      setTimeout(() => {
        this.isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        // Clear cart
        if (window.CartService) {
          window.CartService.clearCart();
        }

        // Show Order Success Modal
        this.showOrderSuccessModal(orderRecord);
      }, 1200);
    });
  },

  getPaymentMethodLabel(method) {
    const map = {
      'cod': 'Cash on Delivery',
      'upi': 'UPI Demo Payment',
      'card': 'Card Demo Payment'
    };
    return map[method] || 'Cash on Delivery';
  },

  /**
   * Display Order Success Modal with animation
   */
  showOrderSuccessModal(order) {
    const modal = document.getElementById('order-confirmation-modal');
    if (!modal) return;

    document.getElementById('modal-order-number').textContent = order.orderId;
    document.getElementById('modal-order-date').textContent = order.orderDate;
    document.getElementById('modal-customer-name').textContent = order.customer.fullName;
    document.getElementById('modal-customer-email').textContent = order.customer.email;
    document.getElementById('modal-customer-phone').textContent = `+91 ${order.customer.phone}`;
    document.getElementById('modal-customer-address').textContent = `${order.customer.address}, ${order.customer.landmark ? order.customer.landmark + ', ' : ''}${order.customer.city}, ${order.customer.state} - ${order.customer.pinCode}, ${order.customer.country}`;
    document.getElementById('modal-shipping-type').textContent = order.deliveryMethod;
    document.getElementById('modal-payment-type').textContent = order.paymentMethod;
    document.getElementById('modal-order-total').textContent = `$${order.totalAmount.toFixed(2)}`;

    // Render items list in receipt
    const itemsRecap = document.getElementById('modal-items-recap');
    if (itemsRecap) {
      let html = '';
      order.items.forEach(item => {
        html += `
          <div class="modal-recap-row">
            <span>${item.quantity}x ${item.title} (${item.size})</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `;
      });
      itemsRecap.innerHTML = html;
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Print Receipt
    const printBtn = document.getElementById('print-receipt-btn');
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }
  }
};

window.CheckoutController = CheckoutController;
