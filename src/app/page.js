'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.cardImage}>
        {product.imagenProducto && !imgError ? (
          <img
            src={product.imagenProducto}
            alt={product.nombreProducto}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.cardImagePlaceholder}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        <div className={styles.cardBadge}>{product.categoriaProducto || 'General'}</div>
        {product.cantidadProducto === 0 && (
          <div className={styles.cardOutOfStock}>Sin stock</div>
        )}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{product.nombreProducto}</h3>
        {product.descripcionProducto && (
          <p className={styles.cardDescription}>{product.descripcionProducto}</p>
        )}
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>
            ${parseFloat(product.precioProducto).toFixed(2)}
          </span>
          <span className={
            product.cantidadProducto === 0
              ? styles.cardStockEmpty
              : product.cantidadProducto <= 5
                ? styles.cardStockWarn
                : styles.cardStock
          }>
            {product.cantidadProducto === 0
              ? 'Agotado'
              : product.cantidadProducto > 5
                ? '+5 disponibles'
                : `${product.cantidadProducto} disponibles`}
          </span>
        </div>
        {product.cantidadProducto > 0 && (
          <button
            className={styles.addToCartBtn}
            onClick={() => onAddToCart(product)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            Agregar al carrito
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  // ── CART STATE ──
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ 
    nombre: '', 
    calle: '', 
    numero: '', 
    colonia: '', 
    referencias: '', 
    cp: '', 
    notas: '' 
  });

  // ==========================================================================
  // FETCH DE PRODUCTOS DESDE EL BACKEND
  // ==========================================================================
  // Esta función `fetchProducts` se comunica con nuestro endpoint GET /api/products.
  // El endpoint es quien realmente ejecuta la consulta en la Base de Datos (Supabase).
  const fetchProducts = useCallback(async (searchVal, categoryVal) => {
    setLoading(true);
    try {
      // Preparamos los parámetros de búsqueda en la URL
      const params = new URLSearchParams();
      if (searchVal) params.set('search', searchVal);
      if (categoryVal && categoryVal !== 'all') params.set('category', categoryVal);

      // Disparamos la petición. Si searchVal='Zapatos', la URL será /api/products?search=Zapatos
      const res = await fetch(`/api/products?${params.toString()}`);

      // Transformamos la respuesta en un objeto JavaScript
      const data = await res.json();

      // Actualizamos el estado interno de React para que la vista se redibuje
      // mostrando los productos venidos desde la base de datos.
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all products initially to extract categories
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        const all = data.products || [];
        const cats = [...new Set(all.map((p) => p.categoriaProducto).filter(Boolean))];
        setCategories(cats);
      });
  }, []);

  useEffect(() => {
    fetchProducts(search, activeCategory);
  }, [search, activeCategory, fetchProducts]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
  };

  // ── CART LOGIC ──
  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.cantidadProducto) return prev; // Max stock reached
        return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleUpdateQty = (productId, delta, maxStock) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === productId) {
        const newQty = item.qty + delta;
        if (newQty > 0 && newQty <= maxStock) {
          return { ...item, qty: newQty };
        }
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.precioProducto * item.qty), 0);
  const cartItemCount = cart.reduce((count, item) => count + item.qty, 0);

  const handleWhatsAppCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Configura el número aquí (código de país sin el '+' + número)
    const whatsappNumber = '522871204151'; // Cambiar por el número real del cliente

    let text = `*¡Hola! Quiero realizar un pedido en NapoStore*\n\n`;
    text += `*Mis datos:*\n`;
    text += `- Nombre: ${checkoutForm.nombre}\n`;
    text += `\n*Dirección de Entrega:*\n`;
    text += `- Calle: ${checkoutForm.calle} #${checkoutForm.numero}\n`;
    text += `- Colonia: ${checkoutForm.colonia}\n`;
    if (checkoutForm.cp) text += `- Código Postal: ${checkoutForm.cp}\n`;
    if (checkoutForm.referencias) text += `- Entre calles / Referencias: ${checkoutForm.referencias}\n`;
    if (checkoutForm.notas) text += `\n*Notas adicionales:*\n${checkoutForm.notas}\n`;

    text += `\n*Mi Pedido:*\n`;
    cart.forEach(item => {
      text += `- ${item.qty}x ${item.nombreProducto} ($${item.precioProducto} c/u) = $${item.precioProducto * item.qty}\n`;
    });
    text += `\n*Total a pagar: $${cartTotal}*`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className={styles.root}>
      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="NapoStore Logo" width={64} height={64} style={{ objectFit: 'contain' }} />
            <span className={styles.logoText}>
              Napo<span style={{ color: '#3B82F6' }}>Store</span>
            </span>
          </div>
          <nav className={styles.nav}>
            <a href="#products" className={styles.navLink}>Productos</a>
            <a href="#about" className={styles.navLink}>Nosotros</a>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroBadge}>
            Bienvenido a NapoStore
          </div>
          <h1 className={styles.heroTitle}>
            Compra lo mejor,<br />
            <span style={{ color: '#1E3A8A' }}>vive diferente</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Descubre nuestra selección de productos seleccionados con la mejor calidad.<br></br>
            Envíos rápidos y seguros.
          </p>
          <a href="#products" className={styles.heroCta}>
            Explorar productos
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div className={styles.heroOrbs}>
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
        </div>
      </section>

      {/* ── PRODUCTS SECTION ── */}
      <section id="products" className={styles.productsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Nuestros <span style={{ color: '#3B82F6' }}>Productos</span>
            </h2>
            <p className={styles.sectionSubtitle}>Encuentra exactamente lo que buscas</p>
          </div>

          {/* Search + Filters */}
          <div className={styles.controls}>
            <div className={styles.searchWrapper}>
              <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Buscar productos..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button className={styles.searchClear} onClick={() => setSearchInput('')}>×</button>
              )}
            </div>

            {categories.length > 0 && (
              <div className={styles.filters}>
                <button
                  className={`${styles.filterBtn} ${activeCategory === 'all' ? styles.filterActive : ''}`}
                  onClick={() => handleCategoryChange('all')}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterActive : ''}`}
                    onClick={() => handleCategoryChange(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className={styles.loadingGrid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
                <path d="M16.5 9.4 7.55 4.24" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" y1="22" x2="12" y2="12" />
                <circle cx="18.5" cy="15.5" r="2.5" />
                <path d="M20.27 17.27 22 19" />
              </svg>
              <p>No se encontraron productos</p>
              <span>Intenta con otros términos de búsqueda</span>
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map((product, i) => (
                <div
                  key={product.id}
                  className={styles.cardWrapper}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <ProductCard product={product} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section id="about" className={styles.about}>
        <div className="container">
          <div className={styles.aboutGrid}>
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="1" />
                    <path d="M16 8h4l3 4v4h-7V8z" />
                    <circle cx="5.5" cy="18.5" r="1.5" />
                    <circle cx="18.5" cy="18.5" r="1.5" />
                  </svg>
                ),
                title: 'Entregas Personales',
                desc: 'Recibe tus productos en tiempo récord, directo a tu puerta en Tuxtepec, Oaxaca.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ),
                title: 'Calidad Premium',
                desc: 'Solo los mejores productos, seleccionados con cuidado.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
                title: 'Soporte Dedicado',
                desc: 'Nuestro equipo está siempre listo para ayudarte en lo que necesites.',
              },
            ].map((item) => (
              <div key={item.title} className={styles.aboutCard}>
                <span className={styles.aboutIcon}>{item.icon}</span>
                <h3 className={styles.aboutCardTitle}>{item.title}</h3>
                <p className={styles.aboutCardDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div className={styles.logo}>
              <img src="/logo.png" alt="NapoStore Logo" width={48} height={48} style={{ objectFit: 'contain' }} />
              <span className={styles.logoText}>NapoStore</span>
            </div>
            <p className={styles.footerCopy}>© {new Date().getFullYear()} NapoStore. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* ── FLOATING CART BUTTON ── */}
      <button
        className={styles.cartFloatBtn}
        onClick={() => setIsCartOpen(true)}
        aria-label="Ver carrito"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        {cartItemCount > 0 && (
          <span className={styles.cartBadge}>{cartItemCount}</span>
        )}
      </button>

      {/* ── CART DRAWER / MODAL ── */}
      <div className={`${styles.cartOverlay} ${isCartOpen ? styles.open : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className={styles.cartDrawer} onClick={(e) => e.stopPropagation()}>
          <div className={styles.cartHeader}>
            <h2 className={styles.cartTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              Tu Pedido
            </h2>
            <button className={styles.cartCloseBtn} onClick={() => setIsCartOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className={styles.cartBody}>
            {cart.length === 0 ? (
              <div className={styles.cartEmpty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  {item.imagenProducto ? (
                    <img src={item.imagenProducto} alt={item.nombreProducto} className={styles.cartItemImg} />
                  ) : (
                    <div className={styles.cartItemImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                    </div>
                  )}
                  <div className={styles.cartItemInfo}>
                    <span className={styles.cartItemName}>{item.nombreProducto}</span>
                    <span className={styles.cartItemPrice}>${parseFloat(item.precioProducto).toFixed(2)}</span>
                  </div>
                  <div className={styles.cartItemControls}>
                    <button className={styles.cartQtyBtn} onClick={() => handleUpdateQty(item.id, -1, item.cantidadProducto)}>-</button>
                    <span className={styles.cartItemQty}>{item.qty}</span>
                    <button className={styles.cartQtyBtn} onClick={() => handleUpdateQty(item.id, 1, item.cantidadProducto)}>+</button>
                  </div>
                  <button className={styles.cartItemRemove} onClick={() => handleRemoveFromCart(item.id)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className={styles.cartFooter}>
              <div className={styles.cartTotal}>
                <span>Total:</span>
                <span style={{ color: '#1E3A8A' }}>${cartTotal.toFixed(2)}</span>
              </div>

              <form className={styles.checkoutForm} onSubmit={handleWhatsAppCheckout}>
                <input
                  type="text"
                  className={styles.checkoutInput}
                  placeholder="Tu Nombre Completo"
                  value={checkoutForm.nombre}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, nombre: e.target.value })}
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    className={styles.checkoutInput}
                    placeholder="Calle"
                    value={checkoutForm.calle}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, calle: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    className={styles.checkoutInput}
                    placeholder="Número"
                    value={checkoutForm.numero}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, numero: e.target.value })}
                    required
                  />
                </div>
                <input
                  type="text"
                  className={styles.checkoutInput}
                  placeholder="Colonia"
                  value={checkoutForm.colonia}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, colonia: e.target.value })}
                  required
                />
                <input
                  type="text"
                  className={styles.checkoutInput}
                  placeholder="Entre qué calles / Referencias"
                  value={checkoutForm.referencias}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, referencias: e.target.value })}
                />
                <input
                  type="text"
                  className={styles.checkoutInput}
                  placeholder="Código Postal"
                  value={checkoutForm.cp}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, cp: e.target.value })}
                />
                <input
                  type="text"
                  className={styles.checkoutInput}
                  placeholder="Notas adicionales (opcional)"
                  value={checkoutForm.notas}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, notas: e.target.value })}
                />
                <button type="submit" className={styles.btnWhatsapp} style={{ marginTop: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Procesar Pedido
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
