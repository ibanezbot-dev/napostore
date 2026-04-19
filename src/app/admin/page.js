'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './admin.module.css';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SECTIONS = { PRODUCTS: 'products', USERS: 'users', SALES: 'sales' };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Spinner() {
  return <span className={styles.spinner} aria-label="Cargando" />;
}

function Alert({ type, message, onClose }) {
  if (!message) return null;
  return (
    <div className={`${styles.alert} ${styles[`alert_${type}`]}`}>
      <span>{message}</span>
      <button onClick={onClose} className={styles.alertClose}>×</button>
    </div>
  );
}

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    nombreProducto: product?.nombreProducto || '',
    descripcionProducto: product?.descripcionProducto || '',
    precioProducto: product?.precioProducto || '',
    cantidadProducto: product?.cantidadProducto || 0,
    categoriaProducto: product?.categoriaProducto || '',
    imagenProducto: product?.imagenProducto || '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(product?.imagenProducto || '');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      setForm((prev) => ({ ...prev, imagenProducto: data.url }));
      setPreview(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombreProducto || !form.precioProducto) {
      setError('Nombre y precio son requeridos');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      onSave(data.product);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="nombreProducto">Nombre *</label>
              <input
                id="nombreProducto"
                name="nombreProducto"
                className={styles.input}
                value={form.nombreProducto}
                onChange={handleChange}
                placeholder="Nombre del producto"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="categoriaProducto">Categoría</label>
              <input
                id="categoriaProducto"
                name="categoriaProducto"
                className={styles.input}
                value={form.categoriaProducto}
                onChange={handleChange}
                placeholder="Ej: Electrónica, Ropa..."
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="descripcionProducto">Descripción</label>
            <textarea
              id="descripcionProducto"
              name="descripcionProducto"
              className={styles.textarea}
              value={form.descripcionProducto}
              onChange={handleChange}
              placeholder="Describe el producto..."
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="precioProducto">Precio (MXN) *</label>
              <input
                id="precioProducto"
                name="precioProducto"
                type="number"
                min="0"
                step="0.01"
                className={styles.input}
                value={form.precioProducto}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="cantidadProducto">Cantidad</label>
              <input
                id="cantidadProducto"
                name="cantidadProducto"
                type="number"
                min="0"
                className={styles.input}
                value={form.cantidadProducto}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Imagen del producto</label>
            <div className={styles.imageUpload}>
              {preview ? (
                <div className={styles.imagePreview}>
                  <img src={preview} alt="Preview" />
                  <button
                    type="button"
                    className={styles.removeImage}
                    onClick={() => { setPreview(''); setForm((p) => ({ ...p, imagenProducto: '' })); }}
                  >
                    ✕ Quitar imagen
                  </button>
                </div>
              ) : (
                <label className={styles.uploadZone} htmlFor="imageFile">
                  {uploading ? (
                    <><Spinner /> Subiendo...</>
                  ) : (
                    <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>Haz clic para subir una imagen</span>
                      <small>PNG, JPG, WEBP — máx. 5 MB</small>
                    </>
                  )}
                  <input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    className={styles.hiddenInput}
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving || uploading}>
              {saving ? <><Spinner /> Guardando...</> : (product ? 'Guardar cambios' : 'Crear producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── USER MODAL ───────────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ username: user?.username || '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username) { setError('El nombre de usuario es requerido'); return; }
    if (!user && !form.password) { setError('La contraseña es requerida'); return; }
    setSaving(true);
    setError('');
    try {
      const url = user ? `/api/admin-users/${user.id}` : '/api/admin-users';
      const method = user ? 'PUT' : 'POST';
      const body = user
        ? { username: form.username, ...(form.password ? { password: form.password } : {}) }
        : { username: form.username, password: form.password };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      onSave(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.modalSm}`}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{user ? 'Editar Usuario' : 'Nuevo Admin'}</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="username">Usuario *</label>
            <input id="username" name="username" className={styles.input} value={form.username} onChange={handleChange} placeholder="Nombre de usuario" required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">{user ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</label>
            <input id="password" name="password" type="password" className={styles.input} value={form.password} onChange={handleChange} placeholder={user ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'} />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? <><Spinner /> Guardando...</> : (user ? 'Guardar' : 'Crear admin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.modalSm}`}>
        <div className={styles.confirmIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onCancel}>Cancelar</button>
          <button className={styles.btnDanger} onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTS PANEL ───────────────────────────────────────────────────────────
function ProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | {type:'create'|'edit', product?}
  const [confirm, setConfirm] = useState(null);
  const [alert, setAlert] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter((p) =>
    p.nombreProducto.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoriaProducto || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (saved) => {
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      if (exists) return prev.map((p) => (p.id === saved.id ? saved : p));
      return [saved, ...prev];
    });
    setModal(null);
    setAlert({ type: 'success', message: 'Producto guardado correctamente' });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setAlert({ type: 'success', message: 'Producto eliminado' });
    } catch {
      setAlert({ type: 'error', message: 'Error al eliminar el producto' });
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div className={styles.panel}>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Productos</h2>
          <p className={styles.panelSubtitle}>{products.length} productos en total</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setModal({ type: 'create' })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo producto
        </button>
      </div>

      <div className={styles.tableSearch}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className={styles.tableSearchInput}
          placeholder="Buscar en la tabla..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loadingCenter}><Spinner /></div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className={styles.noData}>No hay productos</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.tableImg}>
                        {p.imagenProducto ? (
                          <img src={p.imagenProducto} alt={p.nombreProducto} />
                        ) : (
                          <div className={styles.tableImgEmpty}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={styles.productName}>{p.nombreProducto}</span>
                      {p.descripcionProducto && (
                        <span className={styles.productDesc}>{p.descripcionProducto}</span>
                      )}
                    </td>
                    <td>
                      {p.categoriaProducto ? (
                        <span className={styles.categoryTag}>{p.categoriaProducto}</span>
                      ) : '—'}
                    </td>
                    <td className={styles.priceCell}>${parseFloat(p.precioProducto).toFixed(2)}</td>
                    <td>
                      <span className={p.cantidadProducto > 0 ? styles.stockGood : styles.stockEmpty}>
                        {p.cantidadProducto > 0 ? p.cantidadProducto : 'Agotado'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionEdit}
                          onClick={() => setModal({ type: 'edit', product: p })}
                          title="Editar"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className={styles.actionDelete}
                          onClick={() => setConfirm({ id: p.id, name: p.nombreProducto })}
                          title="Eliminar"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal.product || null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message={`¿Eliminar "${confirm.name}"? Esta acción no se puede deshacer.`}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── USERS PANEL ──────────────────────────────────────────────────────────────
function UsersPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [alert, setAlert] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-users');
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSave = (saved) => {
    setUsers((prev) => {
      const exists = prev.find((u) => u.id === saved.id);
      if (exists) return prev.map((u) => (u.id === saved.id ? saved : u));
      return [...prev, saved];
    });
    setModal(null);
    setAlert({ type: 'success', message: 'Usuario guardado correctamente' });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin-users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setAlert({ type: 'success', message: 'Usuario eliminado' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error al eliminar' });
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div className={styles.panel}>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Usuarios Admin</h2>
          <p className={styles.panelSubtitle}>{users.length} administradores registrados</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setModal({ type: 'create' })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo admin
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingCenter}><Spinner /></div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Fecha de creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className={styles.userRow}>
                      <div className={styles.userAvatar}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className={styles.productName}>
                        {u.username}
                        {u.username === currentUser && (
                          <span className={styles.youBadge}>Tú</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(u.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionEdit} onClick={() => setModal({ type: 'edit', user: u })} title="Editar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {u.username !== currentUser && (
                        <button className={styles.actionDelete} onClick={() => setConfirm({ id: u.id, name: u.username })} title="Eliminar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <UserModal
          user={modal.user || null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message={`¿Eliminar al administrador "${confirm.name}"?`}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── PANEL DE REGISTRO Y GESTIÓN DE VENTAS ────────────────────────────────────
// ============================================================================
// Este componente de React es el encargado de interactuar con el backend
// para registrar cada venta manual. Las validaciones de stock restantes
// y totales se manejan internamente, comunicándose mediante `fetch` con
// las rutas del API vistas anteriormente (/api/sales y /api/products).
// ============================================================================
function SalesPanel() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({ productoId: '', cantidad: 1, notas: '' });

  // fetchData se encarga de solicitar al BACKEND la información de la base de datos
  // para pintar tanto el dropdown de productos como la tabla histórica de ventas.
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Promise.all permite hacer 2 llamadas HTTP concurrentes al backend a la vez.
      const [pRes, sRes] = await Promise.all([
        fetch('/api/products'), // Trae todos los productos (para el Select de venta)
        fetch('/api/sales'),    // Trae todas las ventas del historial
      ]);
      const [pData, sData] = await Promise.all([pRes.json(), sRes.json()]);

      // Filtrar el array para mosrar únicamente productos donde haya existencias > 0
      setProducts((pData.products || []).filter((p) => p.cantidadProducto > 0));
      setSales(sData.sales || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedProduct = products.find((p) => String(p.id) === String(form.productoId));

  // LOGICA PARA ENVIAR VENTA A LA BASE DE DATOS
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productoId || form.cantidad < 1) {
      setAlert({ type: 'error', message: 'Selecciona un producto y cantidad válida' });
      return;
    }
    setSubmitting(true);
    setAlert(null);
    try {
      // 1. Envío de datos al Endpoint encargado de la BD transaccional de ventas.
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cantidad: Number(form.cantidad),
          notas: form.notas,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar');

      const msg = data.sinStock
        ? `Venta registrada. ⚠️ El producto "${selectedProduct?.nombreProducto}" se ha agotado.`
        : `Venta registrada. Stock restante: ${data.stockRestante} unidades.`;

      setAlert({ type: data.sinStock ? 'warning' : 'success', message: msg });
      setForm({ productoId: '', cantidad: 1, notas: '' });
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.panel}>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Registro de Ventas</h2>
          <p className={styles.panelSubtitle}>{sales.length} ventas registradas</p>
        </div>
      </div>

      {/* Sale Form */}
      <div className={styles.salesFormCard}>
        <h3 className={styles.salesFormTitle}>Nueva venta</h3>
        <form className={styles.salesForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="sale-product">Producto *</label>
              <select
                id="sale-product"
                className={styles.input}
                value={form.productoId}
                onChange={(e) => setForm((p) => ({ ...p, productoId: e.target.value, cantidad: 1 }))}
                required
              >
                <option value="">Seleccionar producto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreProducto} — Stock: {p.cantidadProducto}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="sale-qty">Cantidad *</label>
              <input
                id="sale-qty"
                type="number"
                min="1"
                max={selectedProduct?.cantidadProducto || 9999}
                className={styles.input}
                value={form.cantidad}
                onChange={(e) => setForm((p) => ({ ...p, cantidad: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="sale-notes">Notas (opcional)</label>
            <input
              id="sale-notes"
              type="text"
              className={styles.input}
              value={form.notas}
              onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
              placeholder="Cliente, canal de venta, etc."
            />
          </div>
          {selectedProduct && (
            <div className={styles.salePreview}>
              <div className={styles.salePreviewRow}>
                <span>Precio unitario</span>
                <strong>${parseFloat(selectedProduct.precioProducto).toFixed(2)}</strong>
              </div>
              <div className={styles.salePreviewRow}>
                <span>Total estimado</span>
                <strong className={styles.saleTotal}>
                  ${(parseFloat(selectedProduct.precioProducto) * Number(form.cantidad || 0)).toFixed(2)}
                </strong>
              </div>
              <div className={styles.salePreviewRow}>
                <span>Stock después de venta</span>
                <strong className={
                  selectedProduct.cantidadProducto - Number(form.cantidad || 0) <= 0
                    ? styles.stockEmpty
                    : selectedProduct.cantidadProducto - Number(form.cantidad || 0) <= 5
                      ? styles.stockWarn
                      : styles.stockGood
                }>
                  {Math.max(0, selectedProduct.cantidadProducto - Number(form.cantidad || 0))} uds.
                </strong>
              </div>
            </div>
          )}
          <div className={styles.modalActions}>
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? <><Spinner /> Registrando...</> : 'Registrar venta'}
            </button>
          </div>
        </form>
      </div>

      {/* Sales History */}
      <div className={styles.panelSubtitle} style={{ fontWeight: 700, color: 'var(--clr-text)' }}>Historial</div>

      {loading ? (
        <div className={styles.loadingCenter}><Spinner /></div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unit.</th>
                <th>Total</th>
                <th>Stock tras venta</th>
                <th>Notas</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={7} className={styles.noData}>Sin ventas registradas</td></tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id}>
                    <td><span className={styles.productName}>{s.nombreProducto}</span></td>
                    <td><span className={styles.categoryTag}>{s.cantidad}</span></td>
                    <td className={styles.priceCell}>${parseFloat(s.precioUnitario || 0).toFixed(2)}</td>
                    <td className={styles.priceCell}>${parseFloat(s.total || 0).toFixed(2)}</td>
                    <td>
                      <span className={
                        s.stockRestante === 0 ? styles.stockEmpty
                          : s.stockRestante <= 5 ? styles.stockWarn
                            : styles.stockGood
                      }>
                        {s.stockRestante === 0 ? 'Agotado' : `${s.stockRestante} uds.`}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{s.notas || '—'}</td>
                    <td className={styles.dateCell}>
                      {new Date(s.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN FORM ───────────────────────────────────────────────────────────────
function LoginForm({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de autenticación');
      onLogin(data.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginRoot}>
      <div className={styles.loginGlow} />
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06d6f0" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#lg)" />
            <path d="M8 10h16M8 16h12M8 22h8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className={styles.loginLogoText}>NapoStore</span>
        </div>
        <h1 className={styles.loginTitle}>Panel Admin</h1>
        <p className={styles.loginSubtitle}>Acceso restringido a administradores</p>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login-user">Usuario</label>
            <input
              id="login-user"
              className={styles.input}
              type="text"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="Nombre de usuario"
              autoComplete="username"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login-pass">Contraseña</label>
            <input
              id="login-pass"
              className={styles.input}
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className={`${styles.btnPrimary} ${styles.btnFull}`} disabled={loading}>
            {loading ? <><Spinner /> Verificando...</> : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ username, onLogout }) {
  const [section, setSection] = useState(SECTIONS.PRODUCTS);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    onLogout();
  };

  return (
    <div className={styles.dashRoot}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="lgSide" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06d6f0" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#lgSide)" />
            <path d="M8 10h16M8 16h12M8 22h8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div>
            <div className={styles.sidebarBrand}>NapoStore</div>
            <div className={styles.sidebarRole}>Admin Panel</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.sidebarLink} ${section === SECTIONS.PRODUCTS ? styles.sidebarLinkActive : ''}`}
            onClick={() => setSection(SECTIONS.PRODUCTS)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
              <polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" />
            </svg>
            Productos
          </button>
          <button
            className={`${styles.sidebarLink} ${section === SECTIONS.USERS ? styles.sidebarLinkActive : ''}`}
            onClick={() => setSection(SECTIONS.USERS)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Usuarios Admin
          </button>
          <button
            className={`${styles.sidebarLink} ${section === SECTIONS.SALES ? styles.sidebarLinkActive : ''}`}
            onClick={() => setSection(SECTIONS.SALES)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Ventas
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUser}>
            <div className={styles.sidebarAvatar}>{username.charAt(0).toUpperCase()}</div>
            <div>
              <div className={styles.sidebarUsername}>{username}</div>
              <div className={styles.sidebarUserRole}>Administrador</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.dashMain}>
        {section === SECTIONS.PRODUCTS && <ProductsPanel />}
        {section === SECTIONS.USERS && <UsersPanel currentUser={username} />}
        {section === SECTIONS.SALES && <SalesPanel />}
      </main>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    fetch('/api/auth/check')
      .then((r) => r.json())
      .then((d) => { if (d.username) setUser(d.username); })
      .catch(() => { })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className={styles.checkingScreen}>
        <Spinner />
      </div>
    );
  }

  if (!user) return <LoginForm onLogin={setUser} />;
  return <Dashboard username={user} onLogout={() => setUser(null)} />;
}
