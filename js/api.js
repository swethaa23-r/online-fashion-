/**
 * STACKLY – Luxury Fashion Boutique
 * API Service Layer (DummyJSON integration with caching & resilient offline fallbacks)
 */

const API_BASE = 'https://dummyjson.com';
const FASHION_CATEGORIES = [
  'womens-dresses',
  'womens-shoes',
  'womens-bags',
  'womens-jewellery',
  'sunglasses',
  'mens-shirts',
  'mens-watches',
  'tops',
  'fragrances'
];

// Offline fallback dataset in case of network interruption or rate limiting
const FALLBACK_PRODUCTS = [
  {
    id: 101,
    title: "Women's Elegant Dress",
    description: "Sculpted Italian silk crepe evening dress with a structured cowl neck, fluid floor-length drape, and hand-finished satin lining. Crafted for unforgettable gala appearances.",
    category: "womens-dresses",
    section: "women",
    price: 380.00,
    discountPercentage: 15,
    rating: 4.9,
    stock: 14,
    badge: "New Arrival",
    isTrending: false,
    isBestSeller: true,
    tags: ["couture", "evening", "gowns", "dress", "silk"],
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 102,
    title: "Premium Casual Shirt",
    description: "Two-ply Egyptian Giza 87 cotton button-down tailored to sartorial perfection. Features genuine Mother-of-Pearl buttons and a semi-spread French collar.",
    category: "mens-shirts",
    section: "men",
    price: 185.00,
    discountPercentage: 12,
    rating: 4.8,
    stock: 22,
    badge: "New Arrival",
    isTrending: false,
    isBestSeller: false,
    tags: ["cotton", "shirt", "casual", "menswear"],
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 103,
    title: "Designer Handbag",
    description: "Architectural structured tote handcrafted from full-grain Parisian calfskin with polished solid brass hardware, suede lining, and secure inner compartments.",
    category: "womens-bags",
    section: "accessories",
    price: 495.00,
    discountPercentage: 10,
    rating: 5.0,
    stock: 9,
    badge: "Trending",
    isTrending: true,
    isBestSeller: true,
    tags: ["bags", "handbag", "leather", "calfskin", "tote"],
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 104,
    title: "Classic Blazer",
    description: "Double-breasted tailored blazer cut from English fresco wool. Flawlessly structured shoulders, peak lapels, and horn button closures.",
    category: "mens-shirts",
    section: "men",
    price: 420.00,
    discountPercentage: 14,
    rating: 4.9,
    stock: 15,
    badge: "Best Seller",
    isTrending: true,
    isBestSeller: true,
    tags: ["blazer", "tailored", "suit", "jacket", "wool"],
    images: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 105,
    title: "Silk Crêpe Pleated Blouse",
    description: "Hand-pleated mulberry silk crêpe blouse featuring a structured fluid drape, French cuffs, and mother-of-pearl buttoning for understated atelier elegance.",
    category: "tops",
    section: "women",
    price: 280.00,
    discountPercentage: 15,
    rating: 4.9,
    stock: 14,
    badge: "New Arrival",
    isTrending: false,
    isBestSeller: true,
    tags: ["silk", "blouse", "crepe", "tops", "couture"],
    images: [
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 106,
    title: "Premium Sneakers",
    description: "Minimalist luxury low-top sneakers fashioned from hand-burnished nappa leather with Italian Margom rubber cupsole and ergonomic leather footbed.",
    category: "womens-shoes",
    section: "accessories",
    price: 260.00,
    discountPercentage: 16,
    rating: 4.9,
    stock: 24,
    badge: "Trending",
    isTrending: true,
    isBestSeller: false,
    tags: ["shoes", "sneakers", "leather", "footwear"],
    images: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 107,
    title: "Women's Ethnic Wear",
    description: "Intricately handwoven heritage Banarasi raw silk ensemble featuring zari border accents, matching dupatta, and contemporary tailored drape.",
    category: "womens-dresses",
    section: "women",
    price: 340.00,
    discountPercentage: 14,
    rating: 4.9,
    stock: 11,
    badge: "New Arrival",
    isTrending: false,
    isBestSeller: true,
    tags: ["ethnic", "heritage", "silk", "saree", "traditional"],
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 108,
    title: "Luxury Accessories",
    description: "Handcrafted 18k yellow gold-plated geometric link necklace paired with matching crystal statement pendant. Hypoallergenic and tarnish-resistant.",
    category: "womens-jewellery",
    section: "accessories",
    price: 220.00,
    discountPercentage: 15,
    rating: 4.8,
    stock: 19,
    badge: "Best Seller",
    isTrending: false,
    isBestSeller: true,
    tags: ["jewellery", "gold", "necklace", "accessories"],
    images: [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 109,
    title: "Sartorial Wool Overcoat",
    description: "Tailored heavyweight cashmere-wool blend trench overcoat with raglan sleeves, storm flap, and horn buttons. Designed to withstand seasons in immaculate elegance.",
    category: "mens-shirts",
    section: "men",
    price: 540.00,
    discountPercentage: 13,
    rating: 5.0,
    stock: 8,
    badge: "Trending",
    isTrending: true,
    isBestSeller: true,
    tags: ["coat", "overcoat", "wool", "cashmere", "menswear"],
    images: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 110,
    title: "Chiffon Runway Gown",
    description: "Bespoke pleated silk chiffon evening gown with an illusion neckline, open back, and sweeping chapel train featured on the Milan Runway.",
    category: "womens-dresses",
    section: "women",
    price: 620.00,
    discountPercentage: 18,
    rating: 4.9,
    stock: 6,
    badge: "Runway",
    isTrending: true,
    isBestSeller: false,
    tags: ["couture", "gown", "runway", "chiffon", "evening"],
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 111,
    title: "Velvet Couture Smoking Blazer",
    description: "Obsidian velvet tailored smoking blazer with sculpted silk-satin peak lapels, structured padded shoulders, and hand-finished Milanese buttonholes.",
    category: "womens-dresses",
    section: "women",
    price: 460.00,
    discountPercentage: 12,
    rating: 4.9,
    stock: 9,
    badge: "New Arrival",
    isTrending: false,
    isBestSeller: false,
    tags: ["velvet", "blazer", "couture", "evening", "smoking jacket"],
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 112,
    title: "Swiss Automatic Horology Timepiece",
    description: "41mm hand-polished surgical steel case with sapphire crystal glass, 48-hour mechanical power reserve, and hand-stitched alligator calfskin strap.",
    category: "mens-watches",
    section: "accessories",
    price: 890.00,
    discountPercentage: 10,
    rating: 5.0,
    stock: 7,
    badge: "Trending",
    isTrending: true,
    isBestSeller: true,
    tags: ["horology", "watch", "automatic", "luxury"],
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"
    ],
    thumbnail: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80"
  }
];

// Product Cache in Session Storage
let memoryCache = null;

const ApiService = {
  /**
   * Fetch all curated products. Queries the DummyJSON products endpoint
   * plus specific fashion categories for a rich fashion catalog.
   */
  async getAllProducts() {
    if (memoryCache && memoryCache.length > 0) {
      return memoryCache;
    }

    try {
      sessionStorage.removeItem('stackly_catalog_cache_v2');
      sessionStorage.removeItem('stackly_catalog_cache_v3');
      const cached = sessionStorage.getItem('stackly_catalog_cache_v4');
      if (cached) {
        memoryCache = JSON.parse(cached);
        return memoryCache;
      }
    } catch (e) {
      console.warn('SessionStorage unavailable, continuing with live fetch.');
    }

    try {
      // 1. Fetch from https://dummyjson.com/products?limit=30&skip=0 as requested
      const limit30Promise = fetch(`${API_BASE}/products?limit=30&skip=0`)
        .then(res => res.ok ? res.json() : { products: [] })
        .then(d => d.products || [])
        .catch(() => []);

      // 2. Fetch specific fashion categories for comprehensive boutique selection
      const categoryPromises = FASHION_CATEGORIES.map(cat =>
        fetch(`${API_BASE}/products/category/${cat}`)
          .then(res => res.ok ? res.json() : { products: [] })
          .then(data => data.products || [])
          .catch(() => [])
      );

      const [limit30Products, ...catResults] = await Promise.all([limit30Promise, ...categoryPromises]);
      const combinedFromCats = catResults.flat();

      // Filter limit30 for relevant beauty, fragrances and fashion
      const relevantLimit30 = limit30Products.filter(p => 
        p.category === 'fragrances' || 
        p.category === 'beauty' || 
        p.category.includes('women') || 
        p.category.includes('men')
      );

      // Merge with curated flagship products so the 8+ required products are always featured
      const normalizedFallback = FALLBACK_PRODUCTS.map((p, idx) => this.normalizeProduct(p, idx));
      
      const productMap = new Map();
      // Add fallback products first
      normalizedFallback.forEach(item => productMap.set(item.id, item));

      // Add fetched unique products
      [...combinedFromCats, ...relevantLimit30].forEach((item, idx) => {
        if (!productMap.has(item.id)) {
          productMap.set(item.id, this.normalizeProduct(item, idx + 20));
        }
      });

      const fullList = Array.from(productMap.values());
      memoryCache = fullList;

      try {
        sessionStorage.setItem('stackly_catalog_cache_v4', JSON.stringify(fullList));
      } catch (e) {
        // ignore quota issues
      }

      return fullList;
    } catch (error) {
      console.error('ApiService.getAllProducts failed, using fallback data:', error);
      const normalizedFallback = FALLBACK_PRODUCTS.map((p, idx) => this.normalizeProduct(p, idx));
      memoryCache = normalizedFallback;
      return normalizedFallback;
    }
  },

  /**
   * Normalize and elevate DummyJSON product attributes for luxury branding
   */
  normalizeProduct(item, idx = 0) {
    let price = Number(item.price);
    if (price < 50) {
      price = Number((price * 3.5).toFixed(2));
    }

    let thumbnail = item.thumbnail || (item.images && item.images[0]) || 'assets/images/hero-fashion-2.svg';
    let images = item.images && item.images.length > 0 ? item.images : [thumbnail];

    // Determine category section: women, men, kids, footwear, bags, watches, accessories, beauty
    const cat = (item.category || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const isKidsItem = title.includes('frock') || title.includes('girl') || title.includes('kid') || (item.tags && item.tags.some(t => ['kids', 'junior', 'frock'].includes(t.toLowerCase())));
    const isFootwear = cat === 'womens-shoes' || cat === 'mens-shoes' || title.includes('shoe') || title.includes('slipper') || title.includes('sneaker') || title.includes('heel') || title.includes('pump') || title.includes('sandal') || title.includes('boot');
    const isBag = cat === 'womens-bags' || cat.includes('bag') || title.includes('handbag') || title.includes('backpack') || title.includes('tote');
    const isWatch = cat === 'mens-watches' || cat.includes('watch') || title.includes('watch') || title.includes('horology');
    const isAccessory = cat === 'womens-jewellery' || cat === 'sunglasses' || title.includes('earring') || title.includes('glasses') || title.includes('sunglass');
    const isBeauty = cat === 'fragrances' || cat === 'beauty' || title.includes('perfume') || title.includes('mascara') || title.includes('lipstick');
    const isMen = (cat.startsWith('mens-') || cat === 'mens-shirts' || title.includes('men shirt') || title.includes('man shirt') || title.includes('mens wear')) && !isWatch && !isFootwear;

    let section = 'women';
    if (isKidsItem) {
      section = 'kids';
    } else if (isFootwear) {
      section = 'footwear';
    } else if (isBag) {
      section = 'bags';
    } else if (isWatch) {
      section = 'watches';
    } else if (isAccessory) {
      section = 'accessories';
    } else if (isBeauty) {
      section = 'beauty';
    } else if (isMen) {
      section = 'men';
    } else {
      section = 'women';
    }

    // Assign luxury badge
    let badge = item.badge || null;
    let isTrending = item.isTrending || false;
    let isBestSeller = item.isBestSeller || false;

    if (!badge) {
      if (item.rating >= 4.75 || idx % 5 === 0) {
        badge = 'Best Seller';
        isBestSeller = true;
      } else if (item.discountPercentage > 14 || idx % 4 === 0) {
        badge = 'Trending';
        isTrending = true;
      } else if (item.id % 2 === 0) {
        badge = 'Runway';
      } else {
        badge = 'New Arrival';
      }
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description || "Crafted with impeccable attention to artisanal detail and timeless sartorial proportion.",
      category: item.category,
      categoryLabel: this.getCategoryLabel(item.category),
      section: section,
      price: price,
      discountPercentage: Math.round(item.discountPercentage || 10),
      originalPrice: Number((price / (1 - (item.discountPercentage || 10) / 100)).toFixed(2)),
      rating: Number((item.rating || 4.8).toFixed(1)),
      stock: item.stock || 12,
      badge: badge,
      isTrending: isTrending,
      isBestSeller: isBestSeller,
      thumbnail: thumbnail,
      images: images,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Noir', hex: '#171717' },
        { name: 'Ivory', hex: '#F8F6F1' },
        { name: 'Camel', hex: '#B69A65' }
      ]
    };
  },

  getCategoryLabel(slug) {
    const map = {
      'womens-dresses': "Women's Couture",
      'womens-shoes': "Footwear & Pumps",
      'womens-bags': "Leather Handbags",
      'womens-jewellery': "Fine Jewellery",
      'sunglasses': "Luxury Eyewear",
      'mens-shirts': "Sartorial Menswear",
      'mens-watches': "Haute Horlogerie",
      'tops': "Silk Tops & Blouses",
      'fragrances': "Maison Parfumerie",
      'beauty': "Haute Skincare"
    };
    return map[slug] || 'Boutique Collection';
  },

  /**
   * Get filtered & sorted products with section/category matching
   */
  async getProducts({ category = 'all', sort = 'featured', priceRange = 'all', limit = null } = {}) {
    const all = await this.getAllProducts();
    let filtered = [...all];

    if (category && category !== 'all') {
      const c = category.toLowerCase().trim();
      if (c === 'women' || c === "women's" || c === "women's fashion") {
        filtered = filtered.filter(p => 
          (p.section === 'women' || p.category === 'womens-dresses') &&
          p.section !== 'kids' &&
          p.section !== 'footwear' &&
          p.section !== 'bags' &&
          p.section !== 'watches' &&
          p.section !== 'accessories' &&
          p.section !== 'beauty' &&
          !p.title.toLowerCase().includes('frock') &&
          !p.title.toLowerCase().includes('shoe') &&
          !p.title.toLowerCase().includes('slipper')
        );
      } else if (c === 'men' || c === "men's" || c === "men's fashion") {
        filtered = filtered.filter(p => 
          (p.section === 'men' || p.category === 'mens-shirts') &&
          p.section !== 'women' &&
          p.section !== 'kids' &&
          p.section !== 'footwear' &&
          p.section !== 'watches'
        );
      } else if (c === 'dresses' || c === 'gown' || c === 'gowns') {
        filtered = filtered.filter(p => {
          const t = p.title.toLowerCase();
          const cat = (p.category || '').toLowerCase();
          const isShoe = p.section === 'footwear' || cat === 'womens-shoes' || t.includes('shoe') || t.includes('slipper') || t.includes('sandal') || t.includes('pump') || t.includes('heel') || t.includes('boot');
          const isFrock = p.section === 'kids' || t.includes('frock') || t.includes('girl');
          const isDress = cat === 'womens-dresses' || t.includes('dress') || t.includes('gown') || t.includes('skirt') || t.includes('suit');
          return isDress && !isShoe && !isFrock;
        });
      } else if (c === 'footwear' || c === 'shoes') {
        filtered = filtered.filter(p => {
          const t = p.title.toLowerCase();
          const cat = (p.category || '').toLowerCase();
          return p.section === 'footwear' || cat === 'womens-shoes' || cat === 'mens-shoes' || t.includes('shoe') || t.includes('slipper') || t.includes('sneaker') || t.includes('pump') || t.includes('heel') || t.includes('boot');
        });
      } else if (c === 'bags') {
        filtered = filtered.filter(p => p.section === 'bags' || p.category === 'womens-bags');
      } else if (c === 'accessories') {
        filtered = filtered.filter(p => p.section === 'accessories' || p.category === 'womens-jewellery' || p.category === 'sunglasses');
      } else if (c === 'watches') {
        filtered = filtered.filter(p => p.section === 'watches' || p.category === 'mens-watches');
      } else if (c === 'beauty' || c === 'fragrance' || c === 'fragrances') {
        filtered = filtered.filter(p => p.section === 'beauty' || p.category === 'beauty' || p.category === 'fragrances');
      } else if (c === 'kids' || c === "kids' fashion") {
        filtered = filtered.filter(p => p.section === 'kids');
      } else {
        filtered = filtered.filter(p => p.category === category || p.section === category);
      }
    }

    if (priceRange && priceRange !== 'all') {
      if (priceRange === 'under-100') {
        filtered = filtered.filter(p => p.price < 100);
      } else if (priceRange === '100-300') {
        filtered = filtered.filter(p => p.price >= 100 && p.price <= 300);
      } else if (priceRange === 'above-300') {
        filtered = filtered.filter(p => p.price > 300);
      }
    }

    switch (sort) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
      case 'popularity':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discount':
        filtered.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
      case 'featured':
      default:
        break;
    }

    if (limit && limit > 0) {
      return filtered.slice(0, limit);
    }

    return filtered;
  },

  async getTrendingProducts(limit = 6) {
    const all = await this.getAllProducts();
    const trending = all.filter(p => p.isTrending || p.badge === 'Trending' || p.discountPercentage >= 14);
    return trending.slice(0, limit);
  },

  async getBestSellerProducts(limit = 6) {
    const all = await this.getAllProducts();
    const bestSellers = all.filter(p => p.isBestSeller || p.badge === 'Best Seller' || p.rating >= 4.7);
    return bestSellers.slice(0, limit);
  },

  async getNewArrivals(limit = 8) {
    const all = await this.getAllProducts();
    return all.slice(0, limit);
  },

  async getProductById(id) {
    const numId = Number(id);
    const catalog = await this.getAllProducts();
    const found = catalog.find(p => p.id === numId);
    if (found) return found;

    try {
      const res = await fetch(`${API_BASE}/products/${numId}`);
      if (res.ok) {
        const item = await res.json();
        return this.normalizeProduct(item);
      }
    } catch (e) {
      console.warn(`Could not fetch product ${id}:`, e);
    }

    return FALLBACK_PRODUCTS[0];
  },

  async searchCatalog(query) {
    if (!query || query.trim() === '') return [];
    const q = query.toLowerCase().trim();
    const catalog = await this.getAllProducts();

    return catalog.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q) ||
      p.section.toLowerCase().includes(q)
    );
  }
};

window.ApiService = ApiService;
