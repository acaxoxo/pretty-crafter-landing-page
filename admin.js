const tokenKey = 'pretty_crafter_admin_token';
const checklistKey = 'pretty_crafter_checklist';

const apiBaseUrl = (() => {
  const meta = document.querySelector('meta[name="api-base-url"]');
  const value = meta?.getAttribute('content')?.trim();
  return value || 'http://localhost:3001';
})();

const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');

const productForm = document.getElementById('productForm');
const productId = document.getElementById('productId');
const productName = document.getElementById('productName');
const productPrice = document.getElementById('productPrice');
const productImage = document.getElementById('productImage');
const productDescription = document.getElementById('productDescription');
const productActive = document.getElementById('productActive');
const productReset = document.getElementById('productReset');
const productsTable = document.getElementById('productsTable');

const leadStatusFilter = document.getElementById('leadStatusFilter');
const leadSearch = document.getElementById('leadSearch');
const leadSearchBtn = document.getElementById('leadSearchBtn');
const leadsContainer = document.getElementById('leadsContainer');

const orderStatusFilter = document.getElementById('orderStatusFilter');
const exportOrdersBtn = document.getElementById('exportOrders');
const ordersTable = document.getElementById('ordersTable');

const statsGrid = document.getElementById('statsGrid');

const seoForm = document.getElementById('seoForm');
const seoTitle = document.getElementById('seoTitle');
const seoDescription = document.getElementById('seoDescription');
const seoKeywords = document.getElementById('seoKeywords');
const seoOgImage = document.getElementById('seoOgImage');

const checklistTimestamp = document.getElementById('checklistTimestamp');
const checklistItems = document.querySelectorAll('.check-item');

const notify = (message, type = 'info') => {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.style.position = 'fixed';
    toast.style.right = '20px';
    toast.style.bottom = '20px';
    toast.style.padding = '12px 16px';
    toast.style.borderRadius = '12px';
    toast.style.color = '#fff';
    toast.style.fontSize = '13px';
    toast.style.boxShadow = '0 10px 24px rgba(0,0,0,0.15)';
    toast.style.zIndex = '9999';
    document.body.appendChild(toast);
  }

  toast.style.background = type === 'error' ? '#c53030' : type === 'success' ? '#2f855a' : '#4a5568';
  toast.textContent = message;
  toast.style.opacity = '1';

  window.clearTimeout(toast._hideTimer);
  toast._hideTimer = window.setTimeout(() => {
    toast.style.opacity = '0';
  }, 2800);
};

const getToken = () => sessionStorage.getItem(tokenKey);
const setToken = (token) => sessionStorage.setItem(tokenKey, token);
const clearToken = () => sessionStorage.removeItem(tokenKey);

const fetchWithAuth = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${getToken() || ''}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Request gagal.');
  }
  return response;
};

const setAuthState = (isAuthed) => {
  if (loginView) loginView.classList.toggle('hidden', isAuthed);
  if (dashboardView) dashboardView.classList.toggle('hidden', !isAuthed);
};

const setActiveSection = (sectionId) => {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === sectionId);
  });
  document.querySelectorAll('main > section').forEach((section) => {
    section.classList.toggle('hidden', section.id !== `section-${sectionId}`);
  });
};

const resetProductForm = () => {
  productForm?.reset();
  if (productId) {
    productId.disabled = false;
  }
  productForm.dataset.mode = 'create';
};

const loadProducts = async () => {
  const response = await fetchWithAuth('/api/admin/products');
  const products = await response.json();
  const tbody = productsTable?.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  products.forEach((product) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>Rp ${Number(product.price || 0).toLocaleString('id-ID')}</td>
      <td>${product.is_active ? 'Aktif' : 'Nonaktif'}</td>
      <td>
        <button class="ghost-btn" data-action="edit" data-id="${product.id}">Edit</button>
        <button class="ghost-btn" data-action="delete" data-id="${product.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(row);
  });
};

const loadLeads = async () => {
  const params = new URLSearchParams();
  if (leadStatusFilter?.value) params.set('status', leadStatusFilter.value);
  if (leadSearch?.value) params.set('q', leadSearch.value);
  const response = await fetchWithAuth(`/api/admin/leads?${params.toString()}`);
  const leads = await response.json();

  if (!leadsContainer) return;
  leadsContainer.innerHTML = '';

  leads.forEach((lead) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;">
        <div>
          <h3 style="margin:0 0 6px; font-size:15px;">${lead.name}</h3>
          <div class="note">${lead.phone}</div>
          <p style="margin:10px 0 0; font-size:13px;">${lead.message}</p>
        </div>
        <div style="min-width:200px;">
          <div class="form-group">
            <label>Status</label>
            <select data-lead-status>
              <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
              <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="converted" ${lead.status === 'converted' ? 'selected' : ''}>Converted</option>
              <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>
          <div class="form-group">
            <label>Catatan</label>
            <textarea rows="2" data-lead-notes>${lead.notes || ''}</textarea>
          </div>
          <button class="primary-btn" data-action="save" data-id="${lead.id}">Simpan</button>
        </div>
      </div>
    `;
    leadsContainer.appendChild(card);
  });
};

const loadOrders = async () => {
  const params = new URLSearchParams();
  if (orderStatusFilter?.value) params.set('status', orderStatusFilter.value);
  const response = await fetchWithAuth(`/api/admin/orders?${params.toString()}`);
  const orders = await response.json();
  const tbody = ordersTable?.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  orders.forEach((order) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.order_code}</td>
      <td>${order.customer_name}</td>
      <td>Rp ${Number(order.total_amount || 0).toLocaleString('id-ID')}</td>
      <td>${order.payment_method || '-'}</td>
      <td>
        <select data-order-status data-id="${order.id}">
          <option value="new" ${order.status === 'new' ? 'selected' : ''}>New</option>
          <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="done" ${order.status === 'done' ? 'selected' : ''}>Done</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
    `;
    tbody.appendChild(row);
  });
};

const loadSummary = async () => {
  const response = await fetchWithAuth('/api/admin/summary');
  const summary = await response.json();
  if (!statsGrid) return;
  statsGrid.innerHTML = '';

  const stats = [
    { label: 'Total Order', value: summary.total_orders },
    { label: 'Order Bulan Ini', value: summary.month_orders },
    { label: 'Pendapatan Total', value: `Rp ${Number(summary.total_revenue).toLocaleString('id-ID')}` },
    { label: 'Pendapatan Bulan Ini', value: `Rp ${Number(summary.month_revenue).toLocaleString('id-ID')}` },
    { label: 'Total Leads', value: summary.total_leads },
    { label: 'Leads Baru', value: summary.new_leads }
  ];

  stats.forEach((stat) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `
      <div class="label">${stat.label}</div>
      <div class="value">${stat.value ?? 0}</div>
    `;
    statsGrid.appendChild(card);
  });
};

const loadSeo = async () => {
  const response = await fetch(`${apiBaseUrl}/api/site-meta`);
  const meta = await response.json();
  if (seoTitle) seoTitle.value = meta.page_title || '';
  if (seoDescription) seoDescription.value = meta.meta_description || '';
  if (seoKeywords) seoKeywords.value = meta.keywords || '';
  if (seoOgImage) seoOgImage.value = meta.og_image_url || '';
};

const loadChecklist = () => {
  const stored = localStorage.getItem(checklistKey);
  if (!stored) {
    checklistTimestamp.textContent = 'Belum ada pemeriksaan.';
    checklistItems.forEach((item) => {
      item.checked = false;
    });
    return;
  }

  const data = JSON.parse(stored);
  checklistItems.forEach((item) => {
    const key = item.dataset.key;
    item.checked = Boolean(data?.items?.[key]);
  });
  if (data?.timestamp) {
    const date = new Date(data.timestamp);
    checklistTimestamp.textContent = `Terakhir dicek: ${date.toLocaleString('id-ID')}`;
  }
};

const saveChecklist = () => {
  const items = {};
  checklistItems.forEach((item) => {
    items[item.dataset.key] = item.checked;
  });
  const payload = {
    items,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem(checklistKey, JSON.stringify(payload));
  loadChecklist();
};

const initAuth = async () => {
  const token = getToken();
  if (!token) {
    setAuthState(false);
    return;
  }

  try {
    await fetchWithAuth('/api/admin/session');
    setAuthState(true);
    await refreshAll();
  } catch (error) {
    clearToken();
    setAuthState(false);
  }
};

const refreshAll = async () => {
  await Promise.all([loadProducts(), loadLeads(), loadOrders(), loadSummary(), loadSeo()]);
  loadChecklist();
};

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (loginError) loginError.classList.add('hidden');

  const username = document.getElementById('loginUsername')?.value || '';
  const password = document.getElementById('loginPassword')?.value || '';

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      throw new Error('Login gagal.');
    }
    const data = await response.json();
    setToken(data.token);
    setAuthState(true);
    await refreshAll();
  } catch (error) {
    if (loginError) loginError.classList.remove('hidden');
  }
});

logoutBtn?.addEventListener('click', async () => {
  try {
    await fetchWithAuth('/api/admin/logout', { method: 'POST' });
  } catch (error) {
    // ignore
  }
  clearToken();
  setAuthState(false);
});

refreshBtn?.addEventListener('click', async () => {
  try {
    await refreshAll();
    notify('Data diperbarui.', 'success');
  } catch (error) {
    notify(error.message || 'Gagal refresh.', 'error');
  }
});

productForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    id: productId.value.trim(),
    name: productName.value.trim(),
    price: Number(productPrice.value || 0),
    description: productDescription.value.trim(),
    image_url: productImage.value.trim(),
    is_active: productActive.checked
  };

  try {
    if (productForm.dataset.mode === 'edit') {
      await fetchWithAuth(`/api/admin/products/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      notify('Produk diperbarui.', 'success');
    } else {
      await fetchWithAuth('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      notify('Produk ditambahkan.', 'success');
    }
    resetProductForm();
    await loadProducts();
  } catch (error) {
    notify(error.message || 'Gagal menyimpan produk.', 'error');
  }
});

productReset?.addEventListener('click', () => {
  resetProductForm();
});

productsTable?.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!action || !id) return;

  if (action === 'edit') {
    const response = await fetchWithAuth('/api/admin/products');
    const products = await response.json();
    const product = products.find((item) => item.id === id);
    if (!product) return;
    productForm.dataset.mode = 'edit';
    productId.value = product.id;
    productId.disabled = true;
    productName.value = product.name;
    productPrice.value = product.price;
    productImage.value = product.image_url || '';
    productDescription.value = product.description || '';
    productActive.checked = Boolean(product.is_active);
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm('Hapus produk ini?');
    if (!confirmed) return;
    try {
      await fetchWithAuth(`/api/admin/products/${id}`, { method: 'DELETE' });
      notify('Produk dihapus.', 'success');
      await loadProducts();
    } catch (error) {
      notify(error.message || 'Gagal menghapus produk.', 'error');
    }
  }
});

leadSearchBtn?.addEventListener('click', async () => {
  await loadLeads();
});

leadsContainer?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action="save"]');
  if (!button) return;
  const card = button.closest('.card');
  const statusSelect = card?.querySelector('[data-lead-status]');
  const notesInput = card?.querySelector('[data-lead-notes]');

  try {
    await fetchWithAuth(`/api/admin/leads/${button.dataset.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: statusSelect?.value,
        notes: notesInput?.value || ''
      })
    });
    notify('Lead diperbarui.', 'success');
  } catch (error) {
    notify(error.message || 'Gagal memperbarui lead.', 'error');
  }
});

orderStatusFilter?.addEventListener('change', () => {
  loadOrders().catch(() => {});
});

ordersTable?.addEventListener('change', async (event) => {
  const select = event.target.closest('[data-order-status]');
  if (!select) return;
  try {
    await fetchWithAuth(`/api/admin/orders/${select.dataset.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: select.value })
    });
    notify('Status order diperbarui.', 'success');
  } catch (error) {
    notify(error.message || 'Gagal memperbarui status.', 'error');
  }
});

exportOrdersBtn?.addEventListener('click', () => {
  const params = new URLSearchParams();
  if (orderStatusFilter?.value) params.set('status', orderStatusFilter.value);
  fetchWithAuth(`/api/admin/orders/export?${params.toString()}`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'orders.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    })
    .catch((error) => {
      notify(error.message || 'Gagal export CSV.', 'error');
    });
});

seoForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await fetchWithAuth('/api/admin/site-meta', {
      method: 'PUT',
      body: JSON.stringify({
        page_title: seoTitle.value.trim(),
        meta_description: seoDescription.value.trim(),
        keywords: seoKeywords.value.trim(),
        og_image_url: seoOgImage.value.trim()
      })
    });
    notify('Meta disimpan.', 'success');
  } catch (error) {
    notify(error.message || 'Gagal menyimpan meta.', 'error');
  }
});

checklistItems.forEach((item) => {
  item.addEventListener('change', saveChecklist);
});

const navButtons = document.querySelectorAll('.nav-btn');
navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    if (!section) return;
    setActiveSection(section);
  });
});

initAuth();
