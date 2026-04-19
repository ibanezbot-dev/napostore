'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product }) {
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
          <span className={styles.cardStock}>
            {product.cantidadProducto > 0
              ? `${product.cantidadProducto} disponibles`
              : 'Agotado'}
          </span>
        </div>
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

  const fetchProducts = useCallback(async (searchVal, categoryVal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchVal) params.set('search', searchVal);
      if (categoryVal && categoryVal !== 'all') params.set('category', categoryVal);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
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

  return (
    <div className={styles.root}>
      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <div className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#06d6f0" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
              <path d="M8 10h16M8 16h12M8 22h8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className={styles.logoText}>
              Napo<span className="gradient-text">Store</span>
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
          <div className={styles.heroBadge}>✨ Bienvenido a NapoStore</div>
          <h1 className={styles.heroTitle}>
            Compra lo mejor,<br />
            <span className="gradient-text">vive diferente</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Descubre nuestra selección de productos cuidadosamente elegidos para ti.
            Calidad y estilo al mejor precio.
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
              Nuestros <span className="gradient-text">Productos</span>
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
                  <ProductCard product={product} />
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
              { icon: '🚀', title: 'Entrega Rápida', desc: 'Recibe tus productos en tiempo récord, directo a tu puerta.' },
              { icon: '🔒', title: 'Compra Segura', desc: 'Transacciones protegidas y tu información siempre segura.' },
              { icon: '💎', title: 'Calidad Premium', desc: 'Solo los mejores productos, seleccionados con cuidado.' },
              { icon: '❤️', title: 'Soporte Dedicado', desc: 'Nuestro equipo está siempre listo para ayudarte.' },
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
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06d6f0" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#logoGrad2)" />
                <path d="M8 10h16M8 16h12M8 22h8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className={styles.logoText}>NapoStore</span>
            </div>
            <p className={styles.footerCopy}>© {new Date().getFullYear()} NapoStore. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
