/**
 * STACKLY – Luxury Fashion Boutique
 * Main Application Orchestrator (Universal Navigation, Search Modal, Quick View, AOS, GSAP, and Multi-section Catalog Engine)
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  currentCategory: 'all',
  currentSort: 'featured',
  catalogProducts: [],
  bestSellersExpanded: false,

  async init() {
    this.initHeaderScroll();
    this.initMobileMenu();
    this.initAnnouncementBar();
    this.initSearchModal();
    this.initQuickViewModal();
    this.initNewsletter();
    this.initCurrencySelector();
    this.highlightActiveNav();

    // Initialize Sub-services
    if (window.WishlistService) window.WishlistService.init();
    if (window.CartService) window.CartService.init();

    // Initialize Libraries
    this.initAOS();
    this.initGSAP();
    this.initStatCounters();

    // If on homepage, initialize hero slider and multi-section catalogs
    if (document.getElementById('hero')) {
      this.initHeroSlider();
    }

    if (document.getElementById('new-arrivals-grid') || document.getElementById('products-catalog-grid')) {
      await this.initHomepageSections();
    }

    // If on 404 page, load recommended products
    if (document.getElementById('recommended-products-grid')) {
      this.initRecommendedProducts();
    }
  },

  /**
   * Header scroll styling: transparent on hero, solid ivory on scroll
   */
  initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const handleScroll = () => {
      if (window.scrollY > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  },

  /**
   * Mobile menu drawer toggle with animated hamburger transformation & scroll locking
   */
  initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const closeBtn = document.getElementById('mobile-menu-close');
    const drawer = document.getElementById('mobile-nav-drawer');
    const overlay = document.getElementById('drawer-overlay');

    if (!toggleBtn || !drawer) return;

    let isMenuOpen = false;

    const openMenu = () => {
      isMenuOpen = true;
      drawer.classList.add('open');
      toggleBtn.classList.add('is-active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      if (overlay) overlay.classList.add('active');

      document.documentElement.classList.add('mobile-nav-open');
      document.body.classList.add('mobile-nav-open');
      document.body.style.overflow = 'hidden';

      const navLinks = drawer.querySelectorAll('.mobile-nav-link, .mobile-action-pill');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(navLinks, 
          { opacity: 0, x: 25 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out', delay: 0.1 }
        );
      }
    };

    const closeMenu = () => {
      if (!isMenuOpen && !drawer.classList.contains('open')) return;
      isMenuOpen = false;
      drawer.classList.remove('open');
      toggleBtn.classList.remove('is-active');
      toggleBtn.setAttribute('aria-expanded', 'false');
      if (overlay) overlay.classList.remove('active');

      document.documentElement.classList.remove('mobile-nav-open');
      document.body.classList.remove('mobile-nav-open');
      document.body.style.overflow = '';
    };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (drawer.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenu();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    drawer.querySelectorAll('.mobile-nav-link, .mobile-action-pill').forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(closeMenu, 150);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeMenu();
      }
    });
  },

  /**
   * Top announcement bar dismiss
   */
  initAnnouncementBar() {
    const bar = document.getElementById('top-announcement-bar');
    const closeBtn = document.getElementById('close-announcement');
    if (bar && closeBtn) {
      closeBtn.addEventListener('click', () => {
        bar.style.display = 'none';
      });
    }
  },

  /**
   * Fullscreen luxury Search Modal
   */
  initSearchModal() {
    const modal = document.getElementById('search-modal');
    const openBtns = document.querySelectorAll('.open-search-modal-btn');
    const closeBtn = document.getElementById('close-search-modal');
    const input = document.getElementById('header-search-input');
    const resultsContainer = document.getElementById('search-results-container');
    const clearBtn = document.getElementById('clear-search-btn');

    if (!modal) return;

    const openSearch = () => {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (input) input.focus();
      }, 100);
    };

    const closeSearch = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if (input) input.value = '';
      if (resultsContainer) resultsContainer.innerHTML = '';
      if (clearBtn) clearBtn.style.display = 'none';
    };

    openBtns.forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSearch();
    }));

    if (closeBtn) closeBtn.addEventListener('click', closeSearch);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeSearch();
      }
    });

    if (clearBtn && input) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        clearBtn.style.display = 'none';
        if (resultsContainer) resultsContainer.innerHTML = '';
      });
    }

    let debounceTimer;
    if (input && resultsContainer) {
      input.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (clearBtn) {
          clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          if (query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
          }

          resultsContainer.innerHTML = `
            <div class="search-loading">
              <span class="luxury-spinner"></span>
              <span>Searching STACKLY Atelier...</span>
            </div>
          `;

          if (window.ApiService) {
            const matches = await window.ApiService.searchCatalog(query);
            this.renderSearchResults(matches, resultsContainer, closeSearch);
          }
        }, 250);
      });
    }

    document.querySelectorAll('.search-tag-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const query = pill.getAttribute('data-tag');
        if (input) {
          input.value = query;
          input.dispatchEvent(new Event('input'));
        }
      });
    });
  },

  renderSearchResults(products, container, closeCallback) {
    if (!products || products.length === 0) {
      container.innerHTML = `
        <div class="search-empty-results">
          <p>No silhouettes match your query. Try searching for <em>gown, silk, bag, horology, eyewear</em>.</p>
        </div>
      `;
      return;
    }

    let html = `<div class="search-results-grid">`;
    products.forEach(p => {
      html += `
        <div class="search-item-card" data-id="${p.id}">
          <div class="search-item-img">
            <img src="${p.thumbnail}" alt="${p.title}" onerror="this.src='assets/images/hero-fashion-2.svg'">
          </div>
          <div class="search-item-info">
            <span class="search-item-cat">${p.categoryLabel}</span>
            <h4 class="search-item-title">${p.title}</h4>
            <div class="search-item-price">$${Number(p.price).toFixed(2)}</div>
            <button type="button" class="btn-text-gold view-from-search-btn" data-id="${p.id}">
              <span>View Piece</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll('.view-from-search-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        closeCallback();
        if (window.ApiService) {
          const product = await window.ApiService.getProductById(id);
          this.openQuickView(product);
        }
      });
    });
  },

  /**
   * Quick View Modal Logic
   */
  initQuickViewModal() {
    const modal = document.getElementById('quick-view-modal');
    const closeBtn = document.getElementById('close-quick-view');
    const overlay = document.getElementById('quick-view-backdrop');

    if (!modal) return;

    const closeModal = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  },

  openQuickView(product) {
    const modal = document.getElementById('quick-view-modal');
    const content = document.getElementById('quick-view-content');
    if (!modal || !content) return;

    let selectedSize = 'M';
    let selectedColor = 'Noir';
    let quantity = 1;

    let thumbHtml = '';
    const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail];
    images.forEach((img, idx) => {
      thumbHtml += `
        <button type="button" class="qv-thumb-btn ${idx === 0 ? 'active' : ''}" data-src="${img}" aria-label="View photo ${idx + 1}">
          <img src="${img}" alt="${product.title} view ${idx + 1}" onerror="this.src='assets/images/hero-fashion-2.svg'">
        </button>
      `;
    });

    content.innerHTML = `
      <div class="qv-grid">
        <div class="qv-gallery-col">
          <div class="qv-main-img-wrap">
            <img id="qv-main-image" src="${images[0]}" alt="${product.title}" onerror="this.src='assets/images/hero-fashion-2.svg'">
            ${product.badge ? `<span class="qv-badge">${product.badge}</span>` : ''}
          </div>
          ${images.length > 1 ? `<div class="qv-thumbnails-strip">${thumbHtml}</div>` : ''}
        </div>

        <div class="qv-details-col">
          <span class="qv-category">${product.categoryLabel}</span>
          <h2 class="qv-title">${product.title}</h2>
          
          <div class="qv-rating-row">
            <div class="rating-stars">
              <i class="fa-solid fa-star"></i>
              <i class="fa-solid fa-star"></i>
              <i class="fa-solid fa-star"></i>
              <i class="fa-solid fa-star"></i>
              <i class="fa-solid fa-star-half-stroke"></i>
            </div>
            <span class="rating-score">${product.rating}</span>
            <span class="rating-divider">•</span>
            <span class="stock-status in-stock">
              <i class="fa-solid fa-circle-check"></i> In Atelier Stock (${product.stock} available)
            </span>
          </div>

          <div class="qv-price-row">
            <span class="qv-current-price">$${Number(product.price).toFixed(2)}</span>
            ${product.discountPercentage > 0 ? `
              <span class="qv-original-price">$${product.originalPrice.toFixed(2)}</span>
              <span class="qv-discount-pill">-${product.discountPercentage}% VIP</span>
            ` : ''}
          </div>

          <p class="qv-description">${product.description}</p>

          <div class="qv-option-group">
            <div class="qv-option-header">
              <span class="option-label">Select Silhouette Size</span>
              <span class="size-guide-link"><i class="fa-solid fa-ruler-horizontal"></i> Atelier Size Guide</span>
            </div>
            <div class="qv-size-selector">
              ${product.sizes.map(sz => `
                <button type="button" class="qv-size-btn ${sz === 'M' ? 'active' : ''}" data-size="${sz}">${sz}</button>
              `).join('')}
            </div>
          </div>

          <div class="qv-option-group">
            <span class="option-label">Color: <strong id="qv-selected-color-label">Noir</strong></span>
            <div class="qv-color-selector">
              ${product.colors.map((c, i) => `
                <button type="button" class="qv-color-btn ${i === 0 ? 'active' : ''}" data-color="${c.name}" style="background-color: ${c.hex};" title="${c.name}"></button>
              `).join('')}
            </div>
          </div>

          <div class="qv-action-row">
            <div class="qty-stepper">
              <button type="button" class="qty-btn" id="qv-qty-minus" aria-label="Decrease quantity">
                <i class="fa-solid fa-minus"></i>
              </button>
              <input type="number" id="qv-qty-input" value="1" min="1" max="10" readonly>
              <button type="button" class="qty-btn" id="qv-qty-plus" aria-label="Increase quantity">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>

            <button type="button" class="btn btn-primary btn-block" id="qv-add-to-cart-btn">
              <i class="fa-solid fa-bag-shopping"></i>
              <span>Add to Shopping Bag</span>
            </button>

            <button type="button" class="qv-wishlist-toggle ${window.WishlistService.isInWishlist(product.id) ? 'active' : ''}" id="qv-wishlist-btn" aria-label="Wishlist piece">
              <i class="${window.WishlistService.isInWishlist(product.id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
          </div>

          <div class="qv-perks-list">
            <div class="qv-perk"><i class="fa-solid fa-truck-fast"></i> Complimentary global express on orders over $250</div>
            <div class="qv-perk"><i class="fa-solid fa-gift"></i> Signature STACKLY black satin gift packaging</div>
            <div class="qv-perk"><i class="fa-solid fa-shield-halved"></i> 100% Certified authentic with certificate</div>
          </div>
        </div>
      </div>
    `;

    content.querySelectorAll('.qv-thumb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.qv-thumb-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mainImg = document.getElementById('qv-main-image');
        if (mainImg) mainImg.src = btn.getAttribute('data-src');
      });
    });

    content.querySelectorAll('.qv-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.qv-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.getAttribute('data-size');
      });
    });

    content.querySelectorAll('.qv-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.qv-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.getAttribute('data-color');
        const lbl = document.getElementById('qv-selected-color-label');
        if (lbl) lbl.textContent = selectedColor;
      });
    });

    const minusBtn = document.getElementById('qv-qty-minus');
    const plusBtn = document.getElementById('qv-qty-plus');
    const qtyInput = document.getElementById('qv-qty-input');

    if (minusBtn && plusBtn && qtyInput) {
      minusBtn.addEventListener('click', () => {
        if (quantity > 1) {
          quantity--;
          qtyInput.value = quantity;
        }
      });
      plusBtn.addEventListener('click', () => {
        if (quantity < 10) {
          quantity++;
          qtyInput.value = quantity;
        }
      });
    }

    const addCartBtn = document.getElementById('qv-add-to-cart-btn');
    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        if (window.CartService) {
          window.CartService.addToCart(product, selectedSize, selectedColor, quantity);
          modal.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }

    const wishBtn = document.getElementById('qv-wishlist-btn');
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        if (window.WishlistService) {
          const isAdded = window.WishlistService.toggleWishlist(product);
          const icon = wishBtn.querySelector('i');
          if (isAdded) {
            wishBtn.classList.add('active');
            if (icon) {
              icon.classList.remove('fa-regular');
              icon.classList.add('fa-solid');
            }
          } else {
            wishBtn.classList.remove('active');
            if (icon) {
              icon.classList.remove('fa-solid');
              icon.classList.add('fa-regular');
            }
          }
        }
      });
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  /**
   * Render loading shimmer skeletons in a grid
   */
  renderSkeletons(containerId, count = 8) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let skeletonHtml = '';
    for (let i = 0; i < count; i++) {
      const isFeatured = (containerId === 'new-arrivals-grid' && i === 0);
      skeletonHtml += `
        <div class="skeleton-card ${isFeatured ? 'skeleton-featured' : ''}" style="${isFeatured ? 'grid-column: span 2;' : ''}">
          <div class="skeleton-media" style="${isFeatured ? 'aspect-ratio: 16 / 11;' : ''}"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w-40"></div>
            <div class="skeleton-line w-80"></div>
            <div class="skeleton-line w-60"></div>
          </div>
        </div>
      `;
    }
    container.innerHTML = skeletonHtml;
  },

  /**
   * Initialize homepage product sections (New Arrivals & Trending Products)
   */
  async initHomepageSections() {
    this.currentCategory = 'all';
    this.currentSort = 'featured';
    this.currentPriceRange = 'all';
    this.editorialDisplayCount = 11;

    // Show loading skeletons first
    this.renderSkeletons('new-arrivals-grid', 7);
    this.renderSkeletons('trending-grid', 4);
    if (document.getElementById('best-sellers-grid')) {
      this.renderSkeletons('best-sellers-grid', 4);
    }
    if (document.getElementById('products-catalog-grid')) {
      this.renderSkeletons('products-catalog-grid', 8);
    }

    if (!window.ApiService) return;

    // Fetch comprehensive boutique catalog (minimum 15+ products)
    this.catalogProducts = await window.ApiService.getAllProducts();

    // Hook Category Chips & Filter Controls (Tabs, Search, Sort, Price, Load More)
    this.hookCategoryFilters();

    // 1. Render New Arrivals with real products in editorial mixed layout
    await this.filterAndRenderCatalog();

    // 2. Render Trending Products as continuous marquee runway loop
    const trending = await window.ApiService.getTrendingProducts(6);
    this.renderTrendingMarquee(trending);

    // 3. Initialize Words From Our Private Circle Horizontal Scroll
    this.initTestimonialsScroll();

    // Hook Special Offers Cards if present
    this.hookSpecialOffers();
  },

  async filterAndRenderCatalog() {
    const targetGrid = document.getElementById('new-arrivals-grid') || document.getElementById('products-catalog-grid');
    if (!targetGrid) return;

    if (!window.ApiService) return;

    let filtered = await window.ApiService.getProducts({
      category: this.currentCategory,
      sort: this.currentSort,
      priceRange: this.currentPriceRange
    });

    const searchInput = document.getElementById('catalog-live-search');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (query) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    this.renderCatalogGrid(filtered);
  },

  hookCategoryFilters() {
    this.currentCategory = 'all';
    this.currentSort = 'featured';
    this.currentPriceRange = 'all';
    this.editorialDisplayCount = 11;

    // 1. Horizontal Category Nav Tabs
    const catTabs = document.querySelectorAll('.editorial-cat-tab, .catalog-filter-btn, .category-chip');
    const updateCategoryNav = (cat) => {
      this.currentCategory = cat;
      this.editorialDisplayCount = 11;

      catTabs.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-category') === cat);
      });

      const targetGrid = document.getElementById('new-arrivals-grid') || document.getElementById('products-catalog-grid');
      if (targetGrid) this.renderSkeletons(targetGrid.id, 7);

      setTimeout(() => {
        this.filterAndRenderCatalog();
      }, 60);
    };

    catTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.getAttribute('data-category');
        updateCategoryNav(cat);
      });
    });

    // 2. Featured Category Cards Trigger (Women, Men, Kids, Accessories)
    document.querySelectorAll('.category-card-trigger').forEach(card => {
      card.addEventListener('click', async (e) => {
        e.preventDefault();
        const cat = card.getAttribute('data-category');
        updateCategoryNav(cat);

        const arrivalsSec = document.getElementById('new-arrivals') || document.getElementById('collection');
        if (arrivalsSec) {
          const y = arrivalsSec.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });

    // 3. Hero CTA Buttons (redirect to 404.html)
    const shopWomenBtn = document.getElementById('hero-shop-women-btn');
    if (shopWomenBtn) {
      shopWomenBtn.addEventListener('click', () => {
        window.location.href = '404.html';
      });
    }

    const shopMenBtn = document.getElementById('hero-shop-men-btn');
    if (shopMenBtn) {
      shopMenBtn.addEventListener('click', () => {
        window.location.href = '404.html';
      });
    }

    // 4. View All Collection button (redirect to 404.html)
    const viewAllBtn = document.getElementById('btn-view-all-collection');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        window.location.href = '404.html';
      });
    }

    // 5. Hook Sorting Select
    const sortSelect = document.getElementById('catalog-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.editorialDisplayCount = 11;
        const targetGrid = document.getElementById('new-arrivals-grid') || document.getElementById('products-catalog-grid');
        if (targetGrid) this.renderSkeletons(targetGrid.id, 7);
        setTimeout(() => {
          this.filterAndRenderCatalog();
        }, 60);
      });
    }

    // 6. Hook Price Range Select
    const priceSelect = document.getElementById('catalog-price-select');
    if (priceSelect) {
      priceSelect.addEventListener('change', (e) => {
        this.currentPriceRange = e.target.value;
        this.editorialDisplayCount = 11;
        const targetGrid = document.getElementById('new-arrivals-grid') || document.getElementById('products-catalog-grid');
        if (targetGrid) this.renderSkeletons(targetGrid.id, 7);
        setTimeout(() => {
          this.filterAndRenderCatalog();
        }, 60);
      });
    }

    // 7. Hook Live Search by Product Name & Clear Button
    const searchInput = document.getElementById('catalog-live-search');
    const searchClear = document.getElementById('catalog-search-clear');
    if (searchInput) {
      let catalogSearchTimer;
      searchInput.addEventListener('input', (e) => {
        if (searchClear) {
          searchClear.style.display = e.target.value.trim().length > 0 ? 'block' : 'none';
        }
        clearTimeout(catalogSearchTimer);
        catalogSearchTimer = setTimeout(() => {
          this.editorialDisplayCount = 11;
          this.filterAndRenderCatalog();
        }, 180);
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        this.editorialDisplayCount = 11;
        this.filterAndRenderCatalog();
        searchInput.focus();
      });
    }

    // 8. Hook Load More Button (redirect to 404.html)
    const loadMoreBtn = document.getElementById('catalog-load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        window.location.href = '404.html';
      });
    }
  },

  resetAllCatalogFilters() {
    this.currentCategory = 'all';
    this.currentSort = 'featured';
    this.currentPriceRange = 'all';
    this.editorialDisplayCount = 11;

    document.querySelectorAll('.editorial-cat-tab, .catalog-filter-btn, .category-chip').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-category') === 'all');
    });

    const searchInput = document.getElementById('catalog-live-search');
    if (searchInput) searchInput.value = '';
    const searchClear = document.getElementById('catalog-search-clear');
    if (searchClear) searchClear.style.display = 'none';

    const sortSelect = document.getElementById('catalog-sort-select');
    if (sortSelect) sortSelect.value = 'featured';

    const priceSelect = document.getElementById('catalog-price-select');
    if (priceSelect) priceSelect.value = 'all';

    const targetGrid = document.getElementById('new-arrivals-grid') || document.getElementById('products-catalog-grid');
    if (targetGrid) this.renderSkeletons(targetGrid.id, 7);

    setTimeout(() => {
      this.filterAndRenderCatalog();
    }, 60);
  },

  hookSpecialOffers() {
    // Card 1: 50% Off Women
    const offer1 = document.getElementById('offer-card-women');
    if (offer1) {
      offer1.addEventListener('click', () => {
        const btn = document.querySelector('[data-category="women"]');
        if (btn) btn.click();
      });
    }

    // Card 2: Buy 2 Get 1 Trending
    const offer2 = document.getElementById('offer-card-trending');
    if (offer2) {
      offer2.addEventListener('click', () => {
        const target = document.getElementById('trending');
        if (target) {
          const y = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    }

    // Card 3: 15% First Order Promo
    const offer3 = document.getElementById('offer-card-first15');
    if (offer3) {
      offer3.addEventListener('click', () => {
        if (window.CartService) {
          window.CartService.applyPromo('STACKLYVIP');
        }
        if (window.showToast) {
          window.showToast('VIP Code STACKLYVIP applied for 15% off!', 'success');
        }
      });
    }
  },

  renderProductGrid(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div class="catalog-empty-state">
          <i class="fa-solid fa-bag-shopping"></i>
          <h3>No Silhouettes Available</h3>
          <p>Explore our other curated atelier collections.</p>
        </div>
      `;
      return;
    }

    let html = '';
    products.forEach((product, idx) => {
      const isWishlisted = window.WishlistService ? window.WishlistService.isInWishlist(product.id) : false;
      const secondImg = product.images && product.images.length > 1 ? product.images[1] : product.thumbnail;

      html += `
        <article class="product-card" data-id="${product.id}" data-aos="fade-up" data-aos-delay="${(idx % 4) * 80}">
          <div class="product-card-media">
            <img class="product-card-img primary-img" src="${product.thumbnail}" alt="${product.title}" loading="lazy" onerror="this.src='assets/images/hero-fashion-2.svg'">
            ${secondImg !== product.thumbnail ? `
              <img class="product-card-img hover-img" src="${secondImg}" alt="${product.title}" loading="lazy" onerror="this.src='assets/images/hero-fashion-2.svg'">
            ` : ''}

            <div class="product-card-badges">
              ${product.badge ? `<span class="product-badge badge-editorial">${product.badge}</span>` : ''}
              ${product.discountPercentage > 12 ? `<span class="product-badge badge-sale">-${product.discountPercentage}%</span>` : ''}
            </div>

            <div class="product-card-actions">
              <button type="button" class="card-action-btn wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" data-wishlist-id="${product.id}" aria-label="Save to Wishlist">
                <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
              <button type="button" class="card-action-btn quick-view-btn" data-id="${product.id}" aria-label="Quick View piece">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>

            <div class="product-card-quick-add">
              <button type="button" class="btn-quick-add" data-id="${product.id}">
                <i class="fa-solid fa-bag-shopping"></i>
                <span>Quick Add to Bag</span>
              </button>
            </div>
          </div>

          <div class="product-card-body">
            <span class="product-category">${product.categoryLabel}</span>
            <h3 class="product-title">
              <a href="#" class="product-title-link quick-view-trigger" data-id="${product.id}">${product.title}</a>
            </h3>

            <div class="product-rating">
              <div class="stars">
                <i class="fa-solid fa-star"></i>
                <span>${product.rating}</span>
              </div>
              <span class="stock-note">• In Stock</span>
            </div>

            <div class="product-price-box">
              <span class="current-price">$${Number(product.price).toFixed(2)}</span>
              ${product.discountPercentage > 0 ? `
                <span class="original-price">$${product.originalPrice.toFixed(2)}</span>
              ` : ''}
            </div>
          </div>
        </article>
      `;
    });

    container.innerHTML = html;
    this.attachProductCardEvents(container);
  },

  renderTrendingMarquee(products) {
    const container = document.getElementById('trending-grid');
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div class="catalog-empty-state">
          <i class="fa-solid fa-bag-shopping"></i>
          <h3>No Silhouettes Available</h3>
          <p>Explore our other curated atelier collections.</p>
        </div>
      `;
      return;
    }

    // Duplicate products across 4 sets (24 cards total) for a seamless continuous marquee loop
    const repeated = [...products, ...products, ...products, ...products];

    let html = '';
    repeated.forEach((product, idx) => {
      const isWishlisted = window.WishlistService ? window.WishlistService.isInWishlist(product.id) : false;
      const secondImg = product.images && product.images.length > 1 ? product.images[1] : product.thumbnail;

      html += `
        <article class="product-card marquee-product-card" data-id="${product.id}" data-card-idx="${idx}">
          <div class="product-card-media">
            <img class="product-card-img primary-img" src="${product.thumbnail}" alt="${product.title}" loading="lazy" onerror="this.src='assets/images/hero-fashion-2.svg'">
            ${secondImg !== product.thumbnail ? `
              <img class="product-card-img hover-img" src="${secondImg}" alt="${product.title}" loading="lazy" onerror="this.src='assets/images/hero-fashion-2.svg'">
            ` : ''}

            <div class="product-card-badges">
              <span class="product-badge badge-editorial"><i class="fa-solid fa-fire-flame-curved"></i> TRENDING</span>
              ${product.discountPercentage > 12 ? `<span class="product-badge badge-sale">-${product.discountPercentage}%</span>` : ''}
            </div>

            <div class="product-card-actions">
              <button type="button" class="card-action-btn wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" data-wishlist-id="${product.id}" aria-label="Save to Wishlist">
                <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
              <button type="button" class="card-action-btn quick-view-btn" data-id="${product.id}" aria-label="Quick View piece">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>

            <div class="product-card-quick-add">
              <button type="button" class="btn-quick-add" data-id="${product.id}">
                <i class="fa-solid fa-bag-shopping"></i>
                <span>Quick Add to Bag</span>
              </button>
            </div>
          </div>

          <div class="product-card-body">
            <span class="product-category">${product.categoryLabel}</span>
            <h3 class="product-title">
              <a href="#" class="product-title-link quick-view-trigger" data-id="${product.id}">${product.title}</a>
            </h3>

            <div class="product-rating">
              <div class="stars">
                <i class="fa-solid fa-star"></i>
                <span>${product.rating}</span>
              </div>
              <span class="stock-note">• In Stock</span>
            </div>

            <div class="product-price-box">
              <span class="current-price">$${Number(product.price).toFixed(2)}</span>
              ${product.discountPercentage > 0 ? `
                <span class="original-price">$${product.originalPrice.toFixed(2)}</span>
              ` : ''}
            </div>
          </div>
        </article>
      `;
    });

    container.innerHTML = html;
    this.attachProductCardEvents(container);
    this.initMarqueeControls(container);
  },

  initMarqueeControls(track) {
    const leftBtn = document.getElementById('trending-dir-left-btn');
    const rightBtn = document.getElementById('trending-dir-right-btn');
    const pauseBtn = document.getElementById('trending-pause-btn');
    const viewport = document.getElementById('trending-marquee-viewport');

    let isPaused = false;

    if (leftBtn) {
      leftBtn.addEventListener('click', () => {
        track.classList.remove('is-reversed');
        if (isPaused) {
          isPaused = false;
          track.classList.remove('is-paused');
          if (pauseBtn) pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }
      });
    }

    if (rightBtn) {
      rightBtn.addEventListener('click', () => {
        track.classList.add('is-reversed');
        if (isPaused) {
          isPaused = false;
          track.classList.remove('is-paused');
          if (pauseBtn) pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        track.classList.toggle('is-paused', isPaused);
        pauseBtn.innerHTML = isPaused
          ? '<i class="fa-solid fa-play"></i>'
          : '<i class="fa-solid fa-pause"></i>';
      });
    }

    if (viewport) {
      let isDown = false;
      let startX;
      let scrollLeft;

      viewport.addEventListener('mousedown', (e) => {
        if (e.target.closest('button, a')) return;
        isDown = true;
        viewport.classList.add('active');
        track.classList.add('is-paused');
        startX = e.pageX - viewport.offsetLeft;
        scrollLeft = viewport.scrollLeft;
      });

      window.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        viewport.classList.remove('active');
        if (!isPaused) {
          setTimeout(() => {
            if (!isPaused) track.classList.remove('is-paused');
          }, 600);
        }
      });

      viewport.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - viewport.offsetLeft;
        const walk = (x - startX) * 1.5;
        viewport.scrollLeft = scrollLeft - walk;
      });
    }
  },

  initTestimonialsScroll() {
    const rail = document.getElementById('testimonials-scroll-rail');
    const prevBtn = document.getElementById('testimonial-prev-btn');
    const nextBtn = document.getElementById('testimonial-next-btn');
    const progressBar = document.getElementById('testimonials-progress-bar');
    const currentIndexEl = document.getElementById('testimonials-current-index');
    const totalCountEl = document.getElementById('testimonials-total-count');

    if (!rail) return;

    const cards = rail.querySelectorAll('.testimonial-card');
    const totalCards = cards.length || 5;
    if (totalCountEl) totalCountEl.textContent = String(totalCards).padStart(2, '0');

    const updateControls = () => {
      const scrollLeft = rail.scrollLeft;
      const maxScroll = Math.max(1, rail.scrollWidth - rail.clientWidth);
      const ratio = Math.min(1, Math.max(0, scrollLeft / maxScroll));

      if (progressBar) {
        const barWidth = 20 + ratio * 80;
        progressBar.style.width = barWidth + '%';
      }

      if (prevBtn) {
        prevBtn.disabled = scrollLeft <= 10;
      }
      if (nextBtn) {
        nextBtn.disabled = scrollLeft >= maxScroll - 10;
      }

      if (currentIndexEl && cards.length > 0) {
        const cardWidth = cards[0].offsetWidth + 32;
        const currentIdx = Math.min(totalCards, Math.max(1, Math.round(scrollLeft / cardWidth) + 1));
        currentIndexEl.textContent = String(currentIdx).padStart(2, '0');
      }
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const cardWidth = (cards[0] ? cards[0].offsetWidth : 360) + 32;
        rail.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const cardWidth = (cards[0] ? cards[0].offsetWidth : 360) + 32;
        rail.scrollBy({ left: cardWidth, behavior: 'smooth' });
      });
    }

    rail.addEventListener('scroll', updateControls, { passive: true });

    let isDown = false;
    let startX;
    let initialScroll;

    rail.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - rail.offsetLeft;
      initialScroll = rail.scrollLeft;
      rail.style.cursor = 'grabbing';
      rail.style.userSelect = 'none';
    });

    window.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        rail.style.cursor = 'grab';
        rail.style.removeProperty('user-select');
      }
    });

    rail.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - rail.offsetLeft;
      const walk = (x - startX) * 1.5;
      rail.scrollLeft = initialScroll - walk;
    });

    updateControls();
    window.addEventListener('resize', updateControls);
  },

  renderCatalogGrid(products) {
    const grid = document.getElementById('new-arrivals-grid') || document.getElementById('products-catalog-grid');
    const countDisplay = document.getElementById('catalog-results-count');
    const loadMoreContainer = document.getElementById('catalog-load-more-container');
    const loadMoreBtn = document.getElementById('catalog-load-more-btn');
    const loadMoreStatus = document.getElementById('catalog-load-status');
    const loadMoreText = document.getElementById('load-more-btn-text');
    if (!grid) return;

    this.currentFilteredProducts = products || [];
    const total = this.currentFilteredProducts.length;

    if (countDisplay) {
      countDisplay.textContent = `${total} ${total === 1 ? 'Silhouette' : 'Silhouettes'} Curated`;
    }

    if (!products || products.length === 0) {
      grid.innerHTML = `
        <div class="catalog-empty-state" style="grid-column: 1 / -1;">
          <i class="fa-solid fa-magnifying-glass"></i>
          <h3>No Silhouettes Discovered</h3>
          <p>Please adjust your filters, price range, or exploration keyword.</p>
          <button type="button" class="btn btn-outline btn-sm reset-catalog-btn">Reset All Filters</button>
        </div>
      `;
      if (loadMoreContainer) loadMoreContainer.style.display = 'none';

      const resetBtn = grid.querySelector('.reset-catalog-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.resetAllCatalogFilters();
        });
      }
      return;
    }

    if (!this.editorialDisplayCount) {
      this.editorialDisplayCount = 11;
    }

    const visibleProducts = this.currentFilteredProducts.slice(0, this.editorialDisplayCount);
    const displayedCount = visibleProducts.length;

    let html = '';

    // Mixed Editorial Layout (ROW 1, ROW 2, ROW 3 Banner, ROW 4)
    if (visibleProducts.length >= 3) {
      // 1. ROW 1: Large Featured Card (occupies 2 columns)
      const featured = visibleProducts[0];
      const isWishlisted0 = window.WishlistService ? window.WishlistService.isInWishlist(featured.id) : false;
      const secondImg0 = featured.images && featured.images.length > 1 ? featured.images[1] : featured.thumbnail;

      html += `
        <article class="editorial-card-featured" data-id="${featured.id}" data-aos="fade-up">
          <div class="featured-card-media">
            <img class="primary-img" src="${featured.thumbnail}" alt="${featured.title}" loading="lazy" onerror="this.src='assets/images/hero-fashion-2.svg'">
            ${secondImg0 !== featured.thumbnail ? `
              <img class="hover-img" src="${secondImg0}" alt="${featured.title}" loading="lazy" onerror="this.src='assets/images/hero-fashion-2.svg'">
            ` : ''}
            <span class="featured-editorial-badge">
              <i class="fa-solid fa-crown"></i>
              <span>FEATURED COUTURE</span>
            </span>
            <div class="product-card-actions">
              <button type="button" class="card-action-btn wishlist-toggle-btn ${isWishlisted0 ? 'active' : ''}" data-wishlist-id="${featured.id}" aria-label="Save to Wishlist">
                <i class="${isWishlisted0 ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
              <button type="button" class="card-action-btn quick-view-btn" data-id="${featured.id}" aria-label="Quick View piece">
                <i class="fa-regular fa-eye"></i>
              </button>
            </div>
          </div>
          <div class="featured-card-body">
            <div>
              <div class="featured-cat-row">
                <span class="featured-card-category">${featured.categoryLabel}</span>
                <div class="featured-card-rating">
                  <i class="fa-solid fa-star"></i>
                  <span>${featured.rating}</span>
                </div>
              </div>
              <h3 class="featured-card-title">
                <a href="#" class="quick-view-trigger" data-id="${featured.id}">${featured.title}</a>
              </h3>
              <p class="featured-card-desc">${featured.description}</p>
            </div>
            <div class="featured-card-bottom">
              <div class="featured-price-box">
                <span class="featured-current-price">$${Number(featured.price).toFixed(2)}</span>
                ${featured.discountPercentage > 0 ? `
                  <span class="featured-original-price">$${featured.originalPrice.toFixed(2)}</span>
                  <span class="product-badge badge-sale">-${featured.discountPercentage}% VIP</span>
                ` : ''}
              </div>
              <div class="featured-action-buttons">
                <button type="button" class="btn-featured-add btn-quick-add" data-id="${featured.id}">
                  <i class="fa-solid fa-bag-shopping"></i>
                  <span>Add to Bag</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      `;

      // ROW 1: Two standard product cards beside featured card (Items 1 & 2)
      for (let i = 1; i <= 2; i++) {
        const p = visibleProducts[i];
        html += this.buildEditorialCardHtml(p, 'standard', i);
      }

      // ROW 2: Items 3, 4, 5, 6 with distinct presentation styles (Minimal, Portrait, Ivory, Runway)
      const row2Styles = ['minimal', 'portrait', 'ivory', 'runway'];
      for (let i = 3; i <= 6; i++) {
        if (i < visibleProducts.length) {
          const p = visibleProducts[i];
          const style = row2Styles[(i - 3) % row2Styles.length];
          html += this.buildEditorialCardHtml(p, style, i);
        }
      }

      // ROW 3: Full-width promotional fashion banner
      html += `
        <div class="editorial-promo-banner" data-aos="fade-up">
          <img class="promo-banner-bg" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80" alt="Editorial Fashion Campaign" onerror="this.src='assets/images/hero-fashion-2.svg'">
          <div class="promo-banner-gradient"></div>
          <div class="promo-banner-content">
            <span class="promo-banner-eyebrow">PRIVATE ATELIER CAPSULE // AUTUMN 2026</span>
            <h3 class="promo-banner-heading">DEFINE YOUR <em>STYLE.</em></h3>
            <p class="promo-banner-desc">
              Where modern architectural precision converges with timeless couture elegance. Explore the limited seasonal capsule curated exclusively for our patrons worldwide.
            </p>
            <div class="promo-banner-actions">
              <button type="button" class="btn-promo-shop" id="btn-promo-shop-collection">
                <span>SHOP THE COLLECTION</span>
                <i class="fa-solid fa-arrow-right"></i>
              </button>
              <span class="promo-banner-cities">PARIS • MILAN • LONDON • SALEM</span>
            </div>
          </div>
        </div>
      `;

      // ROW 4: Items 7, 8, 9, 10+ (Additional products in responsive grid)
      for (let i = 7; i < visibleProducts.length; i++) {
        const p = visibleProducts[i];
        html += this.buildEditorialCardHtml(p, 'standard', i);
      }
    } else {
      // If fewer than 3 products, render standard cards
      visibleProducts.forEach((p, idx) => {
        html += this.buildEditorialCardHtml(p, 'standard', idx);
      });
    }

    grid.innerHTML = html;
    this.attachProductCardEvents(grid);

    // Wire Promo Shop Button (redirect to 404.html)
    const promoShopBtn = grid.querySelector('#btn-promo-shop-collection');
    if (promoShopBtn) {
      promoShopBtn.addEventListener('click', () => {
        window.location.href = '404.html';
      });
    }

    // Update Load More Container
    if (loadMoreContainer) {
      loadMoreContainer.style.display = 'flex';
      if (displayedCount >= total) {
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        if (loadMoreStatus) {
          loadMoreStatus.innerHTML = `<span><i class="fa-solid fa-circle-check"></i> Showing all ${total} curated silhouettes</span>`;
        }
      } else {
        if (loadMoreBtn) {
          loadMoreBtn.style.display = 'inline-flex';
          loadMoreBtn.classList.remove('is-loading');
          const remaining = total - displayedCount;
          if (loadMoreText) {
            loadMoreText.textContent = `LOAD MORE SILHOUETTES (${remaining} REMAINING)`;
          }
        }
        if (loadMoreStatus) {
          loadMoreStatus.textContent = `Displaying ${displayedCount} of ${total} curated pieces`;
        }
      }
    }

    // Trigger GSAP entrance animations
    this.triggerCatalogGSAPAnimations();
  },

  buildEditorialCardHtml(product, styleVariant = 'standard', idx = 0) {
    if (!product) return '';
    const isWishlisted = window.WishlistService ? window.WishlistService.isInWishlist(product.id) : false;
    const secondImg = product.images && product.images.length > 1 ? product.images[1] : product.thumbnail;

    let styleClass = '';
    if (styleVariant === 'minimal') styleClass = 'editorial-card-style-minimal';
    else if (styleVariant === 'portrait') styleClass = 'editorial-card-style-portrait';
    else if (styleVariant === 'ivory') styleClass = 'editorial-card-style-ivory';
    else if (styleVariant === 'runway') styleClass = 'editorial-card-style-runway';

    let badgeHtml = '';
    if (product.badge) {
      badgeHtml += `<span class="product-badge badge-editorial">${product.badge}</span>`;
    } else if (idx % 3 === 0) {
      badgeHtml += `<span class="product-badge badge-editorial">Limited Edition</span>`;
    } else {
      badgeHtml += `<span class="product-badge badge-editorial">New Arrival</span>`;
    }

    if (product.discountPercentage > 12) {
      badgeHtml += `<span class="product-badge badge-sale">-${product.discountPercentage}%</span>`;
    }

    return `
      <article class="editorial-card ${styleClass}" data-id="${product.id}" data-aos="fade-up" data-aos-delay="${(idx % 4) * 80}">
        <div class="product-card-media">
          <img class="primary-img" src="${product.thumbnail}" alt="${product.title}" loading="lazy" onerror="this.src='assets/images/hero-fashion-2.svg'">
          ${secondImg !== product.thumbnail ? `
            <img class="hover-img" src="${secondImg}" alt="${product.title}" loading="lazy" onerror="this.src='assets/images/hero-fashion-2.svg'">
          ` : ''}

          <div class="product-card-badges">
            ${badgeHtml}
          </div>

          <div class="product-card-actions">
            <button type="button" class="card-action-btn wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" data-wishlist-id="${product.id}" aria-label="Save to Wishlist">
              <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <button type="button" class="card-action-btn quick-view-btn" data-id="${product.id}" aria-label="Quick View piece">
              <i class="fa-regular fa-eye"></i>
            </button>
          </div>

          <div class="product-card-quick-add">
            <button type="button" class="btn-quick-add" data-id="${product.id}">
              <i class="fa-solid fa-bag-shopping"></i>
              <span>Quick Add to Bag</span>
            </button>
          </div>
        </div>

        <div class="product-card-body">
          <span class="product-category">${product.categoryLabel}</span>
          <h3 class="product-title">
            <a href="#" class="quick-view-trigger" data-id="${product.id}">${product.title}</a>
          </h3>

          <div class="product-rating">
            <div class="stars">
              <i class="fa-solid fa-star"></i>
              <span>${product.rating}</span>
            </div>
            <span class="stock-note">• In Stock</span>
          </div>

          <div class="product-price-box">
            <span class="current-price">$${Number(product.price).toFixed(2)}</span>
            ${product.discountPercentage > 0 ? `
              <span class="original-price">$${product.originalPrice.toFixed(2)}</span>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  },

  triggerCatalogGSAPAnimations() {
    if (!window.gsap) return;

    const cards = document.querySelectorAll('#new-arrivals-grid .editorial-card, #new-arrivals-grid .editorial-card-featured');
    if (cards.length > 0) {
      window.gsap.from(cards, {
        opacity: 0,
        y: 35,
        duration: 0.65,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
      });
    }

    const featuredMedia = document.querySelector('.editorial-card-featured .featured-card-media .primary-img');
    if (featuredMedia && window.ScrollTrigger) {
      window.gsap.to(featuredMedia, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: '.editorial-card-featured',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    const promoBanner = document.querySelector('.editorial-promo-banner');
    if (promoBanner && window.ScrollTrigger) {
      window.gsap.from('.promo-banner-content', {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: promoBanner,
          start: 'top 80%'
        }
      });
    }
  },

  attachProductCardEvents(container) {
    container.querySelectorAll('.quick-view-btn, .quick-view-trigger').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = e.currentTarget.getAttribute('data-id');
        if (window.ApiService) {
          const product = await window.ApiService.getProductById(id);
          this.openQuickView(product);
        }
      });
    });

    container.querySelectorAll('.wishlist-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = e.currentTarget.getAttribute('data-wishlist-id');
        if (window.ApiService && window.WishlistService) {
          const product = await window.ApiService.getProductById(id);
          const wasInWishlist = window.WishlistService.isInWishlist(product.id);
          window.WishlistService.toggleWishlist(product);

          btn.classList.add('heart-anim');
          setTimeout(() => btn.classList.remove('heart-anim'), 500);

          const icon = btn.querySelector('i');
          if (icon) {
            if (wasInWishlist) {
              icon.className = 'fa-regular fa-heart';
              btn.classList.remove('active');
            } else {
              icon.className = 'fa-solid fa-heart';
              btn.classList.add('active');
            }
          }
        }
      });
    });

    container.querySelectorAll('.btn-quick-add').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = e.currentTarget.getAttribute('data-id');
        if (window.ApiService && window.CartService) {
          const product = await window.ApiService.getProductById(id);
          window.CartService.addToCart(product, 'M', 'Noir', 1);

          // Animated button click feedback
          const originalHtml = btn.innerHTML;
          btn.classList.add('btn-clicked');
          btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Added to Bag</span>`;
          setTimeout(() => {
            btn.classList.remove('btn-clicked');
            btn.innerHTML = originalHtml;
          }, 1400);
        }
      });
    });
  },

  /**
   * Recommended products for 404 page
   */
  async initRecommendedProducts() {
    const grid = document.getElementById('recommended-products-grid');
    if (!grid) return;

    if (window.ApiService) {
      const products = await window.ApiService.getProducts({ limit: 4 });
      this.renderProductGrid('recommended-products-grid', products);
    }
  },

  /**
   * Newsletter VIP form subscription & LocalStorage persistence (100% script-based error rendering)
   */
  initNewsletter() {
    const forms = document.querySelectorAll('.newsletter-subscription-form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        let errorContainer = form.querySelector('.newsletter-error-msg');
        if (!errorContainer) {
          errorContainer = document.createElement('div');
          errorContainer.className = 'form-error-msg newsletter-error-msg';
          form.appendChild(errorContainer);
        }

        if (!emailInput || !emailInput.value.trim()) {
          errorContainer.textContent = 'Please enter your email address to join the STACKLY Circle.';
          errorContainer.style.display = 'block';
          form.classList.add('has-error');
          if (window.showToast) {
            window.showToast('Please enter your email address.', 'error');
          }
          return;
        }

        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errorContainer.textContent = 'Please provide a valid email format (e.g. client@maison.com).';
          errorContainer.style.display = 'block';
          form.classList.add('has-error');
          if (window.showToast) {
            window.showToast('Please enter a valid email address.', 'error');
          }
          return;
        }

        // Clear error on valid submission
        errorContainer.textContent = '';
        errorContainer.style.display = 'none';
        form.classList.remove('has-error');

        // Store subscribed email locally in localStorage
        try {
          const stored = localStorage.getItem('stackly_subscribers');
          const subscribers = stored ? JSON.parse(stored) : [];
          if (!subscribers.includes(email)) {
            subscribers.push(email);
            localStorage.setItem('stackly_subscribers', JSON.stringify(subscribers));
          }
        } catch (err) {
          console.warn('LocalStorage error:', err);
        }

        emailInput.value = '';

        if (window.showToast) {
          window.showToast(`Welcome to STACKLY VIP! Redirecting to boutique archive...`, 'success');
        }

        setTimeout(() => {
          window.location.href = '404.html';
        }, 350);
      });

      // Clear error on input
      const emailInput = form.querySelector('input[type="email"]');
      if (emailInput) {
        emailInput.addEventListener('input', () => {
          const err = form.querySelector('.newsletter-error-msg');
          if (err) {
            err.textContent = '';
            err.style.display = 'none';
          }
          form.classList.remove('has-error');
        });
      }
    });
  },

  /**
   * Animated stats counter using requestAnimationFrame & cubic easing
   */
  initStatCounters() {
    const counters = document.querySelectorAll('.stat-num');
    if (counters.length === 0) return;

    const animateCounter = (el) => {
      const targetVal = parseInt(el.getAttribute('data-target') || '100', 10);
      const text = el.textContent.trim();
      let suffix = '';
      if (text.includes('+')) suffix = '+';
      else if (text.includes('%')) suffix = '%';
      else if (text.toLowerCase().includes('h')) suffix = 'h';

      const duration = 1600;
      const startTime = performance.now();

      const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutCubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * targetVal);
        el.textContent = `${current}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = `${targetVal}${suffix}`;
        }
      };

      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(c => observer.observe(c));
  },

  /**
   * Currency selector toggle
   */
  initCurrencySelector() {
    const selectors = document.querySelectorAll('.currency-selector');
    selectors.forEach(sel => {
      sel.addEventListener('change', (e) => {
        const val = e.target.value;
        if (window.showToast) {
          window.showToast(`Currency updated to ${val}`, 'info');
        }
      });
    });
  },

  /**
   * Highlight active nav link based on location
   */
  highlightActiveNav() {
    const path = window.location.pathname;
    const links = document.querySelectorAll('.nav-link, .mobile-nav-link');

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      if (path.endsWith('/') || path.endsWith('index.html')) {
        if (href === 'index.html' || href === './' || href === '#') {
          link.classList.add('active');
        }
      } else if (path.includes(href) && href !== 'index.html' && href !== './') {
        link.classList.add('active');
      }
    });
  },

  /**
   * AOS Animation library initialization
   */
  initAOS() {
    if (typeof AOS !== 'undefined') {
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      AOS.init({
        duration: prefersReduced ? 0 : 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 50,
        disable: prefersReduced
      });
    }
  },

  heroCollections: [
    {
      tag: 'AUTUMN / WINTER 2026 COLLECTION',
      line1: 'DRESS BEYOND',
      line1Accent: 'BEYOND',
      line2: 'THE ORDINARY.',
      line2Accent: '',
      subtitle: 'Sculpted Italian silk crepe, fluid floor-length draping, and architectural tailoring crafted for memorable gala appearances.',
      img: 'assets/images/hero-editorial-model.webp',
      alt: 'STACKLY Autumn / Winter Haute Couture Campaign',
      lookbook: 'LOOK 01 / AUTUMN COUTURE',
      glassTitle: 'Haute Monograph N° 01',
      glassDesc: 'Pure Italian Mulberry Silk & Hand-Pleated Crepe Draped in Paris.',
      glassSpec: 'Artisanal Run · 50 Pieces',
      glassPrice: '$380.00',
      womenCat: 'women',
      menCat: 'men'
    },
    {
      tag: 'SARTORIAL MENSWEAR CAPSULE',
      line1: 'PRECISION IN',
      line1Accent: 'PRECISION',
      line2: 'EVERY SILHOUETTE.',
      line2Accent: '',
      subtitle: 'Two-ply Egyptian Giza cotton, Savile Row structured fresco wool blazers, and horn button closures engineered for modern distinction.',
      img: 'assets/images/hero-menswear.webp',
      alt: 'STACKLY Sartorial Menswear Tailoring Collection',
      lookbook: 'LOOK 02 / SARTORIAL LINE',
      glassTitle: 'Savile Row Fresco Blazer',
      glassDesc: 'English Fresco Wool & Horn Buttoning with Hand-Rolled Lapels.',
      glassSpec: 'Bespoke Finish · 35 Pieces',
      glassPrice: '$420.00',
      womenCat: 'women',
      menCat: 'men'
    },
    {
      tag: 'CONTEMPORARY RUNWAY EDITION',
      line1: 'TIMELESS POISE,',
      line1Accent: 'POISE,',
      line2: 'MODERN EDGE.',
      line2Accent: '',
      subtitle: 'Pleated silk chiffon evening gowns and minimalist nappa leather outerwear showcased at the Milan Fashion Week runway salon.',
      img: 'assets/images/hero-runway.webp',
      alt: 'STACKLY Contemporary Milan Runway Edition',
      lookbook: 'LOOK 03 / MILAN RUNWAY',
      glassTitle: 'Chiffon Runway Gown',
      glassDesc: 'Illusion Bodice with Fluid Chapel Train in Noir Silk Crepe.',
      glassSpec: 'Runway Capsule · 25 Pieces',
      glassPrice: '$620.00',
      womenCat: 'women',
      menCat: 'men'
    },
    {
      tag: 'ATELIER ACCESSORIES & HOROLOGY',
      line1: 'OBJECTS OF',
      line1Accent: '',
      line2: 'PURE DESIRE.',
      line2Accent: 'DESIRE.',
      subtitle: 'Full-grain Parisian calfskin structured totes paired with Swiss automatic timepieces and 18k gold geometric jewellery.',
      img: 'assets/images/hero-accessories.webp',
      alt: 'STACKLY Luxury Leather Goods & Horology Collection',
      lookbook: 'LOOK 04 / FINE LEATHER',
      glassTitle: 'Parisian Calfskin Tote',
      glassDesc: 'Hand-Stitched Full-Grain Leather with Solid Brass Polished Accents.',
      glassSpec: 'Atelier Craft · 40 Pieces',
      glassPrice: '$495.00',
      womenCat: 'women',
      menCat: 'accessories'
    }
  ],

  heroSlideIndex: 0,
  heroSlideAnimating: false,
  heroAutoPlayTimer: null,

  initHeroSlider() {
    const heroSec = document.getElementById('hero');
    if (!heroSec) return;

    // Preload all 4 hero images for instant, flicker-free slide transitions
    this.heroCollections.forEach(item => {
      const img = new Image();
      img.src = item.img;
    });

    const prevBtn = document.getElementById('hero-prev-btn');
    const nextBtn = document.getElementById('hero-next-btn');
    const dots = document.querySelectorAll('#hero-slide-dots .hero-dot');

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.changeHeroSlide(this.heroSlideIndex - 1);
        this.resetHeroAutoplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.changeHeroSlide(this.heroSlideIndex + 1);
        this.resetHeroAutoplay();
      });
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        this.changeHeroSlide(idx);
        this.resetHeroAutoplay();
      });
    });

    let touchStartX = 0;
    let touchEndX = 0;
    heroSec.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX;
      }
    }, { passive: true });

    heroSec.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
          this.changeHeroSlide(this.heroSlideIndex + 1);
          this.resetHeroAutoplay();
        } else if (touchEndX - touchStartX > 50) {
          this.changeHeroSlide(this.heroSlideIndex - 1);
          this.resetHeroAutoplay();
        }
      }
    }, { passive: true });

    this.startHeroAutoplay();

    heroSec.addEventListener('mouseenter', () => this.stopHeroAutoplay());
    heroSec.addEventListener('mouseleave', () => this.startHeroAutoplay());
  },

  startHeroAutoplay() {
    this.stopHeroAutoplay();
    this.heroAutoPlayTimer = setInterval(() => {
      this.changeHeroSlide(this.heroSlideIndex + 1);
    }, 3500);
  },

  stopHeroAutoplay() {
    if (this.heroAutoPlayTimer) {
      clearInterval(this.heroAutoPlayTimer);
      this.heroAutoPlayTimer = null;
    }
  },

  resetHeroAutoplay() {
    this.startHeroAutoplay();
  },

  changeHeroSlide(newIndex) {
    if (this.heroSlideAnimating) return;
    const total = this.heroCollections.length;
    const targetIdx = (newIndex + total) % total;
    if (targetIdx === this.heroSlideIndex) return;

    this.heroSlideAnimating = true;
    const slide = this.heroCollections[targetIdx];
    this.heroSlideIndex = targetIdx;

    const tagEl = document.getElementById('hero-tag-text');
    const headlineEl = document.getElementById('hero-headline');
    const subtitleEl = document.getElementById('hero-subtitle');
    const slideNumEl = document.getElementById('hero-slide-num');
    const mainImgEl = document.getElementById('hero-main-img');
    const lookbookBadge = document.getElementById('hero-lookbook-badge');
    const glassCard = document.getElementById('hero-glass-card');
    const glassTitle = document.getElementById('glass-title');
    const glassDesc = document.getElementById('glass-desc');
    const glassSpec = document.getElementById('glass-spec');
    const glassPrice = document.getElementById('glass-price');
    const dots = document.querySelectorAll('#hero-slide-dots .hero-dot');

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === targetIdx);
    });

    if (slideNumEl) {
      slideNumEl.textContent = `0${targetIdx + 1}`;
    }

    const buildHeadlineHtml = (s) => {
      const renderWords = (text, accent) => {
        return text.split(' ').map(w => {
          const isAccent = accent && w.includes(accent);
          return `<span class="hero-word ${isAccent ? 'hero-accent-word' : ''}">${w}</span>`;
        }).join(' ');
      };
      return `
        <span class="hero-line">${renderWords(s.line1, s.line1Accent)}</span>
        <span class="hero-line">${renderWords(s.line2, s.line2Accent)}</span>
      `;
    };

    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline({
        onComplete: () => {
          this.heroSlideAnimating = false;
        }
      });

      tl.to(['#hero-headline .hero-word', '#hero-subtitle', '#hero-glass-card'], {
        opacity: 0,
        y: -14,
        duration: 0.28,
        stagger: 0.03,
        ease: 'power2.in'
      });

      tl.to(mainImgEl, {
        opacity: 0.2,
        scale: 0.98,
        duration: 0.32,
        ease: 'power2.in'
      }, '<');

      tl.add(() => {
        if (tagEl) tagEl.textContent = slide.tag;
        if (headlineEl) headlineEl.innerHTML = buildHeadlineHtml(slide);
        if (subtitleEl) subtitleEl.textContent = slide.subtitle;
        if (mainImgEl) {
          mainImgEl.src = slide.img;
          mainImgEl.alt = slide.alt;
        }
        if (lookbookBadge) lookbookBadge.textContent = slide.lookbook;
        if (glassTitle) glassTitle.textContent = slide.glassTitle;
        if (glassDesc) glassDesc.textContent = slide.glassDesc;
        if (glassSpec) glassSpec.textContent = slide.glassSpec;
        if (glassPrice) glassPrice.textContent = slide.glassPrice;
      });

      tl.fromTo('#hero-headline .hero-word',
        { y: '110%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power4.out' }
      );

      tl.fromTo(mainImgEl,
        { opacity: 0.2, scale: 1.04 },
        { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' },
        '<0.1'
      );

      tl.fromTo('#hero-subtitle',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        '<0.2'
      );

      tl.fromTo('#hero-glass-card',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.4)' },
        '<0.15'
      );
    } else {
      if (tagEl) tagEl.textContent = slide.tag;
      if (headlineEl) headlineEl.innerHTML = buildHeadlineHtml(slide);
      if (subtitleEl) subtitleEl.textContent = slide.subtitle;
      if (mainImgEl) mainImgEl.src = slide.img;
      if (lookbookBadge) lookbookBadge.textContent = slide.lookbook;
      if (glassTitle) glassTitle.textContent = slide.glassTitle;
      if (glassDesc) glassDesc.textContent = slide.glassDesc;
      if (glassSpec) glassSpec.textContent = slide.glassSpec;
      if (glassPrice) glassPrice.textContent = slide.glassPrice;
      this.heroSlideAnimating = false;
    }
  },

  /**
   * GSAP & ScrollTrigger Animations
   */
  initGSAP() {
    if (typeof gsap === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    // 1. Watermark Ambient Fade
    const watermark = document.querySelector('.hero-watermark');
    if (watermark) {
      gsap.fromTo(watermark,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 1.8, ease: 'power2.out', delay: 0.1 }
      );
    }

    // 2. Collection Tag
    const heroTag = document.getElementById('hero-collection-tag');
    if (heroTag) {
      gsap.fromTo(heroTag,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', delay: 0.15 }
      );
    }

    // 3. Hero Headline Word Stagger
    const heroWords = document.querySelectorAll('.hero-headline .hero-word');
    if (heroWords.length > 0) {
      gsap.fromTo(heroWords,
        { y: '115%', opacity: 0 },
        {
          y: '0%',
          opacity: 1,
          duration: 1.1,
          stagger: 0.1,
          ease: 'power4.out',
          delay: 0.22
        }
      );
    }

    // 4. Hero Subtitle & CTA & Meta
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroCta = document.querySelector('.hero-cta-group');
    const heroMeta = document.querySelector('.hero-meta-strip');

    if (heroSubtitle) {
      gsap.fromTo(heroSubtitle,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 1.0, delay: 0.5, ease: 'power3.out' }
      );
    }

    if (heroCta) {
      gsap.fromTo(heroCta,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.7, ease: 'power3.out' }
      );
    }

    if (heroMeta) {
      gsap.fromTo(heroMeta,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.9, ease: 'power3.out' }
      );
    }

    // 5. Hero Image Frame Reveal with Clip Path
    const heroImageFrame = document.querySelector('.hero-image-frame');
    if (heroImageFrame) {
      gsap.fromTo(heroImageFrame,
        { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', opacity: 0, scale: 0.95 },
        {
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          opacity: 1,
          scale: 1,
          duration: 1.4,
          delay: 0.25,
          ease: 'power3.inOut'
        }
      );
    }

    // 6. Floating Glass Card
    const glassCard = document.querySelector('.hero-glass-card');
    if (glassCard) {
      gsap.fromTo(glassCard,
        { opacity: 0, y: 35, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1.1, delay: 0.85, ease: 'back.out(1.4)' }
      );
    }

    // 7. Category Cards Staggered ScrollTrigger
    const categoryCards = document.querySelectorAll('.curated-grid .category-pillar-card');
    if (categoryCards.length > 0 && typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo(categoryCards,
        { y: 40, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '#featured-categories',
            start: 'top 90%',
            once: true
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          clearProps: 'opacity,transform'
        }
      );
    }

    // 8. Hero Parallax Interaction
    this.initHeroParallax();

    // 9. Cinema Title & Sentence Cascade Animations
    this.initCinemaAndCascadeAnimations();
  },

  /**
   * Cinema Title & Sentence Cascade Animations
   * Cinema Title: High-impact cinematic reveal for all headings
   * Sentence Cascade: Fluid downward cascading entrance for paragraphs
   */
  initCinemaAndCascadeAnimations() {
    const headings = document.querySelectorAll('h1, h2, .section-title, .hero-title, .editorial-title-display, .promo-banner-heading, .cart-page-title, .summary-card-title');
    headings.forEach(heading => {
      if (!heading.classList.contains('cinema-title')) {
        heading.classList.add('cinema-title');
      }
      if (window.gsap && typeof ScrollTrigger !== 'undefined') {
        window.gsap.fromTo(heading,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: heading,
              start: 'top 88%',
              once: true
            }
          }
        );
      }
    });

    const paragraphs = document.querySelectorAll('p.section-subtitle, p.hero-desc, p.editorial-title-desc, p.promo-banner-desc, p.testimonial-quote, p.cart-page-subtitle');
    paragraphs.forEach((p, idx) => {
      if (!p.classList.contains('sentence-cascade')) {
        p.classList.add('sentence-cascade');
      }
      if (window.gsap && typeof ScrollTrigger !== 'undefined') {
        window.gsap.fromTo(p,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: (idx % 3) * 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: p,
              start: 'top 88%',
              once: true
            }
          }
        );
      }
    });
  },

  /**
   * Hero Mouse Parallax Effect
   */
  initHeroParallax() {
    const heroSection = document.getElementById('hero');
    const heroImg = document.querySelector('.hero-image-frame img');
    const glassCard = document.querySelector('.hero-glass-card');
    const watermark = document.querySelector('.hero-watermark');
    if (!heroSection || !heroImg) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
      const yNorm = (e.clientY - rect.top) / rect.height - 0.5;

      if (typeof gsap !== 'undefined') {
        gsap.to(heroImg, {
          x: xNorm * 18,
          y: yNorm * 18,
          duration: 0.7,
          ease: 'power2.out',
          overwrite: 'auto'
        });
        if (glassCard) {
          gsap.to(glassCard, {
            x: -xNorm * 22,
            y: -yNorm * 22,
            duration: 0.8,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
        if (watermark) {
          gsap.to(watermark, {
            x: -xNorm * 28,
            y: -yNorm * 20,
            duration: 1.1,
            ease: 'power1.out',
            overwrite: 'auto'
          });
        }
      }
    });

    heroSection.addEventListener('mouseleave', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(heroImg, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
        if (glassCard) {
          gsap.to(glassCard, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
        }
        if (watermark) {
          gsap.to(watermark, { x: 0, y: 0, duration: 1.0, ease: 'power1.out' });
        }
      }
    });
  }
};

/**
 * Global Luxury Toast Notification Helper
 */
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `luxury-toast toast-${type}`;

  let iconHtml = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'error') {
    iconHtml = '<i class="fa-solid fa-circle-exclamation"></i>';
  } else if (type === 'info') {
    iconHtml = '<i class="fa-solid fa-bell"></i>';
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconHtml}</div>
    <div class="toast-message">${message}</div>
    <button type="button" class="toast-close-btn" aria-label="Close notification">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  const dismiss = () => {
    toast.classList.remove('visible');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 400);
  };

  toast.querySelector('.toast-close-btn').addEventListener('click', dismiss);
  setTimeout(dismiss, 3800);
};

window.App = App;
