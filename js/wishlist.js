/**
 * STACKLY – Luxury Fashion Boutique
 * Wishlist Service (LocalStorage integration with off-canvas drawer & badge synchronization)
 */

const WISHLIST_STORAGE_KEY = 'stackly_wishlist_v1';

const WishlistService = {
  getWishlist() {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('LocalStorage error in getWishlist:', e);
      return [];
    }
  },

  saveWishlist(items) {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage error in saveWishlist:', e);
    }
    this.updateBadges();
  },

  isInWishlist(id) {
    const list = this.getWishlist();
    return list.some(item => Number(item.id) === Number(id));
  },

  toggleWishlist(product) {
    let list = this.getWishlist();
    const existingIndex = list.findIndex(item => Number(item.id) === Number(product.id));
    let added = false;

    if (existingIndex > -1) {
      list.splice(existingIndex, 1);
      added = false;
      if (window.showToast) {
        window.showToast(`Removed from your Wishlist`, 'info');
      }
    } else {
      list.push({
        id: product.id,
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice,
        categoryLabel: product.categoryLabel || 'Haute Couture',
        thumbnail: product.thumbnail || 'assets/images/hero-fashion-2.svg'
      });
      added = true;
      if (window.showToast) {
        window.showToast(`Added to your Wishlist`, 'success');
      }
    }

    this.saveWishlist(list);
    this.syncHeartIcons();
    this.renderDrawer();
    return added;
  },

  removeFromWishlist(id) {
    let list = this.getWishlist();
    list = list.filter(item => Number(item.id) !== Number(id));
    this.saveWishlist(list);
    this.syncHeartIcons();
    this.renderDrawer();
    if (window.showToast) {
      window.showToast(`Piece removed from Wishlist`, 'info');
    }
  },

  getWishlistCount() {
    return this.getWishlist().length;
  },

  updateBadges() {
    const count = this.getWishlistCount();
    const badges = document.querySelectorAll('.wishlist-count-badge');
    badges.forEach(b => {
      b.textContent = count;
      if (count > 0) {
        b.classList.remove('hidden');
      } else {
        b.classList.add('hidden');
      }
    });
  },

  syncHeartIcons() {
    const buttons = document.querySelectorAll('[data-wishlist-id]');
    buttons.forEach(btn => {
      const id = btn.getAttribute('data-wishlist-id');
      const icon = btn.querySelector('i');
      if (this.isInWishlist(id)) {
        btn.classList.add('active');
        if (icon) {
          icon.classList.remove('fa-regular');
          icon.classList.add('fa-solid');
        }
      } else {
        btn.classList.remove('active');
        if (icon) {
          icon.classList.remove('fa-solid');
          icon.classList.add('fa-regular');
        }
      }
    });
  },

  renderDrawer() {
    const container = document.getElementById('wishlist-items-container');
    const countElem = document.getElementById('wishlist-drawer-count');
    if (!container) return;

    const items = this.getWishlist();
    if (countElem) {
      countElem.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="drawer-empty-state">
          <div class="empty-icon-wrap">
            <i class="fa-regular fa-heart"></i>
          </div>
          <h3>Your Wishlist is Empty</h3>
          <p>Curate your private selection of signature silhouettes and haute accessories.</p>
          <a href="index.html#collection" class="btn btn-primary btn-sm close-wishlist-btn">Explore Collection</a>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach(item => {
      html += `
        <div class="drawer-item" data-id="${item.id}">
          <div class="drawer-item-img">
            <img src="${item.thumbnail}" alt="${item.title}" onerror="this.src='assets/images/hero-fashion-2.svg'">
          </div>
          <div class="drawer-item-details">
            <span class="drawer-item-cat">${item.categoryLabel}</span>
            <h4 class="drawer-item-title">${item.title}</h4>
            <div class="drawer-item-price">$${Number(item.price).toFixed(2)}</div>
            <div class="drawer-item-actions">
              <button class="btn-text-gold move-to-cart-btn" data-id="${item.id}">
                <i class="fa-solid fa-bag-shopping"></i> Move to Bag
              </button>
              <button class="btn-remove-item remove-wishlist-item" data-id="${item.id}" aria-label="Remove item">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Attach listeners
    container.querySelectorAll('.remove-wishlist-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.removeFromWishlist(id);
      });
    });

    container.querySelectorAll('.move-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (window.ApiService && window.CartService) {
          const product = await window.ApiService.getProductById(id);
          window.CartService.addToCart(product, 'M', 'Noir', 1);
          this.removeFromWishlist(id);
        }
      });
    });
  },

  openDrawer() {
    const drawer = document.getElementById('wishlist-drawer');
    const overlay = document.getElementById('drawer-overlay');
    this.renderDrawer();
    if (drawer && overlay) {
      drawer.classList.add('open');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeDrawer() {
    const drawer = document.getElementById('wishlist-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  },

  init() {
    this.updateBadges();
    this.syncHeartIcons();

    // Trigger buttons
    document.querySelectorAll('.open-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    });

    const closeBtn = document.getElementById('close-wishlist-drawer');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }

    const overlay = document.getElementById('drawer-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.closeDrawer();
        if (window.CartService && window.CartService.closeDrawer) {
          window.CartService.closeDrawer();
        }
      });
    }
  }
};

window.WishlistService = WishlistService;
