/**
 * TVN ADMIN DASHBOARD - CORE CONTROLLER
 * Thương hiệu: Công ty TNHH Trung Vạn Niên (TVN Recycling)
 * Tên miền: thumuaphelieutvn.com
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    user: null,
    token: null,
    data: {
      settings: {},
      prices: [],
      leads: [],
      commissionTiers: []
    },
    activeTab: 'overview',
    priceCategoryFilter: 'all',
    priceSearch: '',
    leadStatusFilter: 'all',
    leadSearch: '',
    selectedLead: null,
    editPriceItem: null
  };

  // DOM Elements
  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');
  const btnLogout = document.getElementById('btnLogout');
  const navLinks = document.querySelectorAll('.nav-link[data-tab]');
  const viewSections = document.querySelectorAll('.view-section');
  const headerTitle = document.getElementById('headerPageTitle');
  const headerSub = document.getElementById('headerPageSub');
  const leadsBadgeNav = document.getElementById('leadsBadgeNav');
  const leadsBadgeHeader = document.getElementById('leadsBadgeHeader');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('adminSidebar');
  const toastContainer = document.getElementById('toastContainer');

  // Modals
  const leadDetailModal = document.getElementById('leadDetailModal');
  const editPriceModal = document.getElementById('editPriceModal');

  // =========================================================================
  // 1. AUTHENTICATION
  // =========================================================================
  function initAuth() {
    const savedToken = localStorage.getItem('tvn_admin_token');
    const savedUser = localStorage.getItem('tvn_admin_user');

    if (savedToken && savedUser) {
      state.token = savedToken;
      state.user = JSON.parse(savedUser);
      loginOverlay.style.display = 'none';
      loadAllData();
    } else {
      loginOverlay.style.display = 'flex';
    }

    // Login Form Submit
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userVal = document.getElementById('loginUsername').value.trim();
      const passVal = document.getElementById('loginPassword').value.trim();
      const btnSubmit = loginForm.querySelector('button[type="submit"]');

      btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';
      btnSubmit.disabled = true;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: userVal, password: passVal })
        });
        const json = await res.json();

        if (json.success) {
          state.token = json.token;
          state.user = json.user;
          localStorage.setItem('tvn_admin_token', json.token);
          localStorage.setItem('tvn_admin_user', JSON.stringify(json.user));
          loginOverlay.style.display = 'none';
          showToast('Đăng nhập quản trị thành công! Chào mừng bạn.', 'success');
          loadAllData();
        } else {
          showToast(json.message || 'Sai thông tin đăng nhập!', 'error');
        }
      } catch (err) {
        // Fallback offline validation
        if (userVal === 'admin' && passVal === 'tvn2026@') {
          state.token = 'offline-token';
          state.user = { name: 'Ban Quản Trị TVN', role: 'SuperAdmin' };
          localStorage.setItem('tvn_admin_token', state.token);
          localStorage.setItem('tvn_admin_user', JSON.stringify(state.user));
          loginOverlay.style.display = 'none';
          showToast('Đăng nhập thành công (chế độ dự phòng)!', 'success');
          loadAllData();
        } else {
          showToast('Không thể kết nối máy chủ hoặc sai thông tin!', 'error');
        }
      } finally {
        btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập Quản Trị';
        btnSubmit.disabled = false;
      }
    });

    // Logout
    btnLogout.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?')) {
        localStorage.removeItem('tvn_admin_token');
        localStorage.removeItem('tvn_admin_user');
        state.token = null;
        state.user = null;
        loginOverlay.style.display = 'flex';
        showToast('Đã đăng xuất an toàn.', 'gold');
      }
    });
  }

  // =========================================================================
  // 2. DATA FETCHING & SYNC
  // =========================================================================
  async function loadAllData() {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        state.data = await res.json();
      } else {
        throw new Error('API returned status ' + res.status);
      }
    } catch (e) {
      console.warn('Could not fetch from /api/data, using fallback structure', e);
      // If offline or first load failed, load from local fallback
      if (!state.data.prices || state.data.prices.length === 0) {
        state.data = getDefaultFallbackData();
      }
    }

    updateBadgeCounts();
    renderCurrentTab();
  }

  function updateBadgeCounts() {
    const pendingLeads = (state.data.leads || []).filter(l => l.status === 'pending');
    const count = pendingLeads.length;
    if (leadsBadgeNav) {
      leadsBadgeNav.textContent = count;
      leadsBadgeNav.style.display = count > 0 ? 'inline-block' : 'none';
    }
    if (leadsBadgeHeader) {
      leadsBadgeHeader.style.display = count > 0 ? 'block' : 'none';
    }
  }

  // =========================================================================
  // 3. TAB NAVIGATION CONTROLLER
  // =========================================================================
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const targetTab = link.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  function switchTab(tabId) {
    state.activeTab = tabId;

    navLinks.forEach(l => {
      if (l.getAttribute('data-tab') === tabId) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });

    viewSections.forEach(sec => {
      if (sec.id === 'view-' + tabId) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // Update Header Titles
    const titles = {
      'overview': { title: 'Bảng Điều Khiển Tổng Quan', sub: 'Số liệu KPI, tiến độ khảo sát và phân tích thu mua TVN' },
      'prices': { title: 'Quản Lý Bảng Giá Phế Liệu', sub: 'Điều chỉnh giá niêm yết hàng ngày, xu hướng giá và thưởng lô lớn' },
      'leads': { title: 'Quản Lý Đơn Đặt Lịch & Khách Hàng', sub: 'Tiếp nhận, xử lý yêu cầu khảo sát tận nơi từ website' },
      'commission': { title: 'Chính Sách Hoa Hồng & Đối Tác', sub: 'Cấu hình các mức chiết khấu và thưởng hoa hồng người giới thiệu' },
      'settings': { title: 'Cấu Hình Doanh Nghiệp & Website', sub: 'Thông tin hotline, trụ sở Ninh Bình và thông báo trực tuyến' }
    };

    if (titles[tabId]) {
      headerTitle.textContent = titles[tabId].title;
      headerSub.textContent = titles[tabId].sub;
    }

    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
    }

    renderCurrentTab();
  }

  function renderCurrentTab() {
    switch (state.activeTab) {
      case 'overview': renderOverview(); break;
      case 'prices': renderPrices(); break;
      case 'leads': renderLeads(); break;
      case 'commission': renderCommission(); break;
      case 'settings': renderSettings(); break;
    }
  }

  // Mobile menu toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // =========================================================================
  // 4. VIEW: TỔNG QUAN (OVERVIEW)
  // =========================================================================
  function renderOverview() {
    const leads = state.data.leads || [];
    const prices = state.data.prices || [];

    const totalLeads = leads.length;
    const pendingLeads = leads.filter(l => l.status === 'pending').length;
    const scheduledLeads = leads.filter(l => l.status === 'scheduled').length;
    const completedLeads = leads.filter(l => l.status === 'completed').length;

    // Update KPI cards
    document.getElementById('kpiTotalLeads').textContent = totalLeads;
    document.getElementById('kpiPendingLeads').textContent = pendingLeads;
    document.getElementById('kpiActiveQuotes').textContent = prices.length;
    document.getElementById('kpiCompletedLeads').textContent = completedLeads;

    // Render Recent Leads Table in Overview
    const recentTableBody = document.getElementById('overviewRecentLeadsBody');
    if (recentTableBody) {
      const recent = leads.slice(0, 5);
      if (recent.length === 0) {
        recentTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-muted);">Chưa có yêu cầu khảo sát nào.</td></tr>';
      } else {
        recentTableBody.innerHTML = recent.map(l => {
          return `
            <tr>
              <td>
                <strong style="color: #fff;">${escapeHtml(l.fullName)}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(l.createdAt)}</div>
              </td>
              <td>
                <a href="tel:${l.phone}" style="color: var(--primary-light); text-decoration: none; font-weight: 600;">
                  <i class="fa-solid fa-phone" style="font-size: 0.75rem;"></i> ${l.phone}
                </a>
              </td>
              <td><span style="font-size: 0.82rem; color: var(--text-secondary);">${escapeHtml(l.location || 'Ninh Bình')}</span></td>
              <td><span style="font-weight: 600; color: #fbbf24;">${escapeHtml(l.scrapType)}</span></td>
              <td><span class="status-pill ${l.status}">${escapeHtml(l.statusText || l.status)}</span></td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  // =========================================================================
  // 5. VIEW: QUẢN LÝ BẢNG GIÁ (PRICES)
  // =========================================================================
  function renderPrices() {
    const tableBody = document.getElementById('priceTableBody');
    if (!tableBody) return;

    let items = state.data.prices || [];

    // Filter by Category
    if (state.priceCategoryFilter !== 'all') {
      items = items.filter(i => i.category === state.priceCategoryFilter);
    }

    // Filter by Search
    if (state.priceSearch.trim()) {
      const q = state.priceSearch.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.spec.toLowerCase().includes(q) || 
        i.categoryName.toLowerCase().includes(q)
      );
    }

    if (items.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 36px; color: var(--text-muted);">Không tìm thấy loại phế liệu phù hợp.</td></tr>';
      return;
    }

    tableBody.innerHTML = items.map((item, index) => {
      return `
        <tr data-id="${item.id}">
          <td>
            <span class="item-badge ${item.category}">${escapeHtml(item.categoryName)}</span>
          </td>
          <td>
            <strong style="color: #fff; font-size: 0.92rem;">${escapeHtml(item.name)}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 3px;">${escapeHtml(item.spec)}</div>
          </td>
          <td><strong>${item.unit}</strong></td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <input type="text" class="form-control-admin price-display-input" 
                     value="${escapeHtml(item.priceDisplay)}" 
                     style="width: 170px; padding: 6px 10px; font-weight: 700; color: var(--primary-light);"
                     data-id="${item.id}" data-field="priceDisplay" />
              <span style="font-size: 0.78rem; color: var(--text-muted);">đ/${item.unit}</span>
            </div>
          </td>
          <td>
            <select class="form-control-admin price-trend-select" data-id="${item.id}" data-field="trend" style="width: 120px; padding: 6px 8px;">
              <option value="up" ${item.trend === 'up' ? 'selected' : ''}>Tăng ↗</option>
              <option value="stable" ${item.trend === 'stable' ? 'selected' : ''}>Ổn định ➔</option>
              <option value="down" ${item.trend === 'down' ? 'selected' : ''}>Giảm ↘</option>
            </select>
          </td>
          <td>
            <input type="text" class="form-control-admin" 
                   value="${escapeHtml(item.bulkBonus || '')}" 
                   placeholder="+1.000 đ/kg (>1 tấn)" 
                   style="width: 180px; padding: 6px 10px; font-size: 0.8rem;"
                   data-id="${item.id}" data-field="bulkBonus" />
          </td>
          <td>
            <button type="button" class="btn-action-icon btn-edit-price-modal" data-id="${item.id}" title="Chỉnh sửa chi tiết">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Inline Change Listeners
    tableBody.querySelectorAll('input[data-field], select[data-field]').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const field = e.target.getAttribute('data-field');
        const val = e.target.value;

        const target = state.data.prices.find(p => p.id === id);
        if (target) {
          target[field] = val;
          if (field === 'trend') {
            const trendMap = { 'up': 'Tăng ↗', 'stable': 'Ổn định ➔', 'down': 'Giảm ↘' };
            target.trendText = trendMap[val] || val;
          }
        }
      });
    });

    // Attach Modal Edit Button Listeners
    tableBody.querySelectorAll('.btn-edit-price-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditPriceModal(id);
      });
    });
  }

  // Price Category Filter Tabs
  document.querySelectorAll('.price-cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.price-cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.priceCategoryFilter = tab.getAttribute('data-cat');
      renderPrices();
    });
  });

  // Price Search Input
  const priceSearchInput = document.getElementById('priceSearchInput');
  if (priceSearchInput) {
    priceSearchInput.addEventListener('input', (e) => {
      state.priceSearch = e.target.value;
      renderPrices();
    });
  }

  // Bulk % Adjustment buttons
  const btnBulkIncrease = document.getElementById('btnBulkIncrease');
  const btnBulkDecrease = document.getElementById('btnBulkDecrease');
  const btnSavePrices = document.getElementById('btnSavePrices');

  if (btnBulkIncrease) {
    btnBulkIncrease.addEventListener('click', () => {
      adjustPricesByPercent(5);
    });
  }

  if (btnBulkDecrease) {
    btnBulkDecrease.addEventListener('click', () => {
      adjustPricesByPercent(-5);
    });
  }

  function adjustPricesByPercent(pct) {
    if (!confirm(`Bạn có chắc chắn muốn ${pct > 0 ? 'TĂNG' : 'GIẢM'} đồng loạt ${Math.abs(pct)}% giá tất cả mặt hàng?`)) return;

    state.data.prices.forEach(item => {
      if (item.priceMin) item.priceMin = Math.round(item.priceMin * (1 + pct / 100) / 500) * 500;
      if (item.priceMax) item.priceMax = Math.round(item.priceMax * (1 + pct / 100) / 500) * 500;
      item.priceDisplay = `${formatVNDNumber(item.priceMin)} - ${formatVNDNumber(item.priceMax)}`;
      item.trend = pct > 0 ? 'up' : 'down';
      item.trendText = pct > 0 ? 'Tăng ↗' : 'Giảm ↘';
    });

    renderPrices();
    showToast(`Đã điều chỉnh ${pct > 0 ? '+' : ''}${pct}% giá cho toàn bộ danh mục. Nhấn "Lưu & Áp Dụng" để hoàn tất.`, 'gold');
  }

  if (btnSavePrices) {
    btnSavePrices.addEventListener('click', async () => {
      btnSavePrices.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
      btnSavePrices.disabled = true;

      try {
        const res = await fetch('/api/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prices: state.data.prices })
        });
        const json = await res.json();
        if (json.success) {
          showToast('✅ Đã lưu và áp dụng bảng giá mới lên website thành công!', 'success');
        } else {
          showToast(json.message || 'Lỗi khi lưu bảng giá', 'error');
        }
      } catch (err) {
        // LocalStorage Fallback
        localStorage.setItem('tvn_custom_prices', JSON.stringify(state.data.prices));
        showToast('Đã lưu bảng giá vào bộ nhớ hệ thống!', 'success');
      } finally {
        btnSavePrices.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Lưu & Áp Dụng Lên Website';
        btnSavePrices.disabled = false;
      }
    });
  }

  // Edit Price Modal
  function openEditPriceModal(id) {
    const item = state.data.prices.find(p => p.id === id);
    if (!item) return;

    state.editPriceItem = item;
    document.getElementById('editPriceName').value = item.name;
    document.getElementById('editPriceSpec').value = item.spec;
    document.getElementById('editPriceUnit').value = item.unit;
    document.getElementById('editPriceDisplay').value = item.priceDisplay;
    document.getElementById('editPriceTrend').value = item.trend;
    document.getElementById('editPriceBonus').value = item.bulkBonus || '';

    editPriceModal.classList.add('open');
  }

  const editPriceForm = document.getElementById('editPriceForm');
  if (editPriceForm) {
    editPriceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.editPriceItem) return;

      state.editPriceItem.name = document.getElementById('editPriceName').value.trim();
      state.editPriceItem.spec = document.getElementById('editPriceSpec').value.trim();
      state.editPriceItem.unit = document.getElementById('editPriceUnit').value.trim();
      state.editPriceItem.priceDisplay = document.getElementById('editPriceDisplay').value.trim();
      state.editPriceItem.trend = document.getElementById('editPriceTrend').value;
      const trendMap = { 'up': 'Tăng ↗', 'stable': 'Ổn định ➔', 'down': 'Giảm ↘' };
      state.editPriceItem.trendText = trendMap[state.editPriceItem.trend] || '';
      state.editPriceItem.bulkBonus = document.getElementById('editPriceBonus').value.trim();

      editPriceModal.classList.remove('open');
      renderPrices();
      showToast(`Đã cập nhật thông tin "${state.editPriceItem.name}".`, 'success');
    });
  }

  // =========================================================================
  // 6. VIEW: QUẢN LÝ ĐƠN ĐẶT LỊCH & CRM (LEADS)
  // =========================================================================
  function renderLeads() {
    const tableBody = document.getElementById('leadsTableBody');
    if (!tableBody) return;

    let leads = state.data.leads || [];

    // Filter by Status
    if (state.leadStatusFilter !== 'all') {
      leads = leads.filter(l => l.status === state.leadStatusFilter);
    }

    // Filter by Search (Name, Phone, Location)
    if (state.leadSearch.trim()) {
      const q = state.leadSearch.toLowerCase();
      leads = leads.filter(l => 
        l.fullName.toLowerCase().includes(q) || 
        l.phone.includes(q) || 
        (l.location && l.location.toLowerCase().includes(q)) || 
        (l.scrapType && l.scrapType.toLowerCase().includes(q))
      );
    }

    if (leads.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 36px; color: var(--text-muted);">Không có đơn khảo sát nào phù hợp.</td></tr>';
      return;
    }

    tableBody.innerHTML = leads.map(lead => {
      return `
        <tr data-lead-id="${lead.id}">
          <td><strong style="color: var(--primary-light); font-size: 0.8rem;">#${lead.id}</strong></td>
          <td>
            <strong style="color: #fff; font-size: 0.92rem;">${escapeHtml(lead.fullName)}</strong>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
              <i class="fa-regular fa-clock"></i> ${formatDate(lead.createdAt)}
            </div>
          </td>
          <td>
            <a href="tel:${lead.phone}" style="color: var(--primary-light); font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-phone" style="font-size: 0.8rem;"></i> ${lead.phone}
            </a>
          </td>
          <td>
            <div style="font-size: 0.84rem; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(lead.location)}">
              <i class="fa-solid fa-location-dot" style="color: var(--accent-amber); font-size: 0.75rem;"></i> ${escapeHtml(lead.location || 'Ninh Bình')}
            </div>
          </td>
          <td>
            <span style="font-weight: 600; color: #fbbf24; font-size: 0.84rem;">${escapeHtml(lead.scrapType)}</span>
            <div style="font-size: 0.76rem; color: var(--text-muted);">Ước tính: ${escapeHtml(lead.estimatedWeight || 'N/A')}</div>
          </td>
          <td>
            <select class="form-control-admin lead-status-select" data-id="${lead.id}" style="width: 145px; padding: 4px 8px; font-size: 0.8rem;">
              <option value="pending" ${lead.status === 'pending' ? 'selected' : ''}>⏳ Chờ liên hệ</option>
              <option value="scheduled" ${lead.status === 'scheduled' ? 'selected' : ''}>📅 Đã xếp lịch</option>
              <option value="completed" ${lead.status === 'completed' ? 'selected' : ''}>✅ Đã thanh toán</option>
              <option value="cancelled" ${lead.status === 'cancelled' ? 'selected' : ''}>❌ Đã hủy</option>
            </select>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <a href="tel:${lead.phone}" class="btn-action-icon call" title="Gọi điện cho khách">
                <i class="fa-solid fa-phone"></i>
              </a>
              <button type="button" class="btn-action-icon btn-view-lead" data-id="${lead.id}" title="Xem chi tiết đơn">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button type="button" class="btn-action-icon delete btn-delete-lead" data-id="${lead.id}" title="Xóa đơn">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Status select change
    tableBody.querySelectorAll('.lead-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        const newStatus = e.target.value;
        await updateLeadStatus(id, newStatus);
      });
    });

    // View lead detail button
    tableBody.querySelectorAll('.btn-view-lead').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openLeadDetailModal(id);
      });
    });

    // Delete lead button
    tableBody.querySelectorAll('.btn-delete-lead').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Bạn có chắc chắn muốn xóa đơn khảo sát #${id}?`)) {
          await deleteLead(id);
        }
      });
    });
  }

  // Filter Leads tabs
  document.querySelectorAll('.lead-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.lead-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.leadStatusFilter = tab.getAttribute('data-status');
      renderLeads();
    });
  });

  // Search Leads input
  const leadSearchInput = document.getElementById('leadSearchInput');
  if (leadSearchInput) {
    leadSearchInput.addEventListener('input', (e) => {
      state.leadSearch = e.target.value;
      renderLeads();
    });
  }

  // Update Lead Status via API
  async function updateLeadStatus(id, newStatus) {
    try {
      const res = await fetch('/api/leads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        const lead = state.data.leads.find(l => l.id === id);
        if (lead) {
          lead.status = newStatus;
          lead.statusText = json.lead.statusText;
        }
        updateBadgeCounts();
        showToast(`Đã cập nhật trạng thái đơn #${id}`, 'success');
      }
    } catch (e) {
      // Local fallback
      const lead = state.data.leads.find(l => l.id === id);
      if (lead) lead.status = newStatus;
      updateBadgeCounts();
      showToast(`Đã cập nhật trạng thái đơn #${id} (cục bộ)`, 'success');
    }
  }

  // Delete Lead via API
  async function deleteLead(id) {
    try {
      const res = await fetch('/api/leads/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (json.success) {
        state.data.leads = state.data.leads.filter(l => l.id !== id);
        updateBadgeCounts();
        renderLeads();
        showToast(`Đã xóa đơn #${id}`, 'gold');
      }
    } catch (e) {
      state.data.leads = state.data.leads.filter(l => l.id !== id);
      updateBadgeCounts();
      renderLeads();
      showToast(`Đã xóa đơn #${id}`, 'gold');
    }
  }

  // Lead Detail Modal
  function openLeadDetailModal(id) {
    const lead = state.data.leads.find(l => l.id === id);
    if (!lead) return;

    state.selectedLead = lead;
    document.getElementById('modalLeadId').textContent = '#' + lead.id;
    document.getElementById('modalLeadName').textContent = lead.fullName;
    document.getElementById('modalLeadPhone').textContent = lead.phone;
    document.getElementById('modalLeadPhoneLink').href = 'tel:' + lead.phone;
    document.getElementById('modalLeadLocation').textContent = lead.location || 'Chưa cung cấp';
    document.getElementById('modalLeadScrap').textContent = lead.scrapType;
    document.getElementById('modalLeadWeight').textContent = lead.estimatedWeight || 'Chưa xác định';
    document.getElementById('modalLeadTime').textContent = formatDate(lead.createdAt);
    document.getElementById('modalLeadStatus').value = lead.status;
    document.getElementById('modalLeadNote').value = lead.note || '';
    document.getElementById('modalLeadAssigned').value = lead.assignedTo || '';

    leadDetailModal.classList.add('open');
  }

  const btnSaveLeadDetail = document.getElementById('btnSaveLeadDetail');
  if (btnSaveLeadDetail) {
    btnSaveLeadDetail.addEventListener('click', async () => {
      if (!state.selectedLead) return;

      const newStatus = document.getElementById('modalLeadStatus').value;
      const newNote = document.getElementById('modalLeadNote').value.trim();
      const newAssigned = document.getElementById('modalLeadAssigned').value.trim();

      try {
        await fetch('/api/leads/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: state.selectedLead.id,
            status: newStatus,
            note: newNote,
            assignedTo: newAssigned
          })
        });
      } catch (e) {
        console.warn('Offline note update');
      }

      state.selectedLead.status = newStatus;
      state.selectedLead.note = newNote;
      state.selectedLead.assignedTo = newAssigned;

      leadDetailModal.classList.remove('open');
      renderLeads();
      updateBadgeCounts();
      showToast(`Đã lưu thông tin xử lý đơn #${state.selectedLead.id}`, 'success');
    });
  }

  // Export CSV
  const btnExportLeads = document.getElementById('btnExportLeads');
  if (btnExportLeads) {
    btnExportLeads.addEventListener('click', () => {
      exportLeadsToCSV();
    });
  }

  function exportLeadsToCSV() {
    const leads = state.data.leads || [];
    if (leads.length === 0) {
      showToast('Không có dữ liệu đơn để xuất file!', 'error');
      return;
    }

    const headers = ['Mã Đơn', 'Họ Tên', 'Số Điện Thoại', 'Địa Điểm', 'Loại Phế Liệu', 'Khối Lượng', 'Trạng Thái', 'Ghi Chú', 'Ngày Gửi'];
    const rows = leads.map(l => [
      `"${l.id}"`,
      `"${l.fullName.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${(l.location || '').replace(/"/g, '""')}"`,
      `"${l.scrapType.replace(/"/g, '""')}"`,
      `"${l.estimatedWeight || ''}"`,
      `"${l.statusText || l.status}"`,
      `"${(l.note || '').replace(/"/g, '""')}"`,
      `"${formatDate(l.createdAt)}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TVN_Don_Khao_Sat_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('✅ Đã xuất file CSV thành công!', 'success');
  }

  // =========================================================================
  // 7. VIEW: CHÍNH SÁCH HOA HỒNG (COMMISSION)
  // =========================================================================
  function renderCommission() {
    const tiersContainer = document.getElementById('commissionTiersList');
    if (!tiersContainer) return;

    const tiers = state.data.commissionTiers || [];
    tiersContainer.innerHTML = tiers.map((t, idx) => {
      return `
        <div class="tier-admin-card">
          <span class="tier-badge-top">${t.tier}</span>
          <div class="tier-weight">${t.weightRange}</div>
          <div class="tier-reward">${t.commissionAmount}</div>
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary-light); margin-bottom: 6px;">
            Thưởng cộng thêm: ${t.perKgBonus}
          </div>
          <p class="tier-desc">${t.desc}</p>
        </div>
      `;
    }).join('');
  }

  // Commission Calculator Simulator
  const calcWeightInput = document.getElementById('adminCalcWeight');
  const calcResultDiv = document.getElementById('adminCalcResult');
  if (calcWeightInput && calcResultDiv) {
    calcWeightInput.addEventListener('input', () => {
      const w = parseFloat(calcWeightInput.value) || 0;
      let estReward = 0;
      let note = '';

      if (w < 500) {
        estReward = Math.round(500000 + w * 2000);
        note = 'Khuyến khích đối tác thân thiết (500k – 1.5tr)';
      } else if (w <= 1000) {
        estReward = Math.round(3000000 + (w - 500) * 4000);
        note = 'Mức 1: Từ 500kg – 1 Tấn (3tr – 5tr)';
      } else if (w <= 5000) {
        estReward = Math.round(6000000 + (w - 1000) * 1500);
        note = 'Mức 2: Từ 1 – 5 Tấn (6tr – 12tr)';
      } else if (w <= 10000) {
        estReward = Math.round(15000000 + (w - 5000) * 3000);
        note = 'Mức 3: Từ 5 – 10 Tấn (15tr – 30tr)';
      } else if (w <= 30000) {
        estReward = Math.round(35000000 + (w - 10000) * 1250);
        note = 'Mức 4: Từ 10 – 30 Tấn (35tr – 60tr)';
      } else {
        estReward = Math.round(60000000 + Math.min(40000000, (w - 30000) * 800));
        note = 'Mức 5: Hợp đồng VIP trên 50 Tấn (60tr – 100tr+)';
      }

      calcResultDiv.innerHTML = `
        <div style="font-size: 1.5rem; font-weight: 800; color: #fbbf24; font-family: var(--font-heading);">
          ${formatVNDNumber(estReward)} đ
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
          ${note}
        </div>
      `;
    });
  }

  // =========================================================================
  // 8. VIEW: CẤU HÌNH DOANH NGHIỆP & HỆ THỐNG (SETTINGS)
  // =========================================================================
  function renderSettings() {
    const s = state.data.settings || {};
    document.getElementById('setCompanyName').value = s.companyName || 'Công ty TNHH Trung Vạn Niên';
    document.getElementById('setShortName').value = s.shortName || 'TVN Recycling';
    document.getElementById('setHotline1').value = s.hotline1 || '0927 776 789';
    document.getElementById('setHotline2').value = s.hotline2 || '0938 333 456';
    document.getElementById('setEmail').value = s.email || 'phelieutrungvannien@gmail.com';
    document.getElementById('setAddress').value = s.address || 'Khu Công Nghiệp Châu Sơn, Phường Châu Sơn, Tỉnh Ninh Bình';
    document.getElementById('setAnnouncement').value = s.announcement || '';
    document.getElementById('setAnnouncementActive').checked = s.announcementActive !== false;
  }

  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSave = settingsForm.querySelector('button[type="submit"]');
      btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...';
      btnSave.disabled = true;

      const updatedSettings = {
        companyName: document.getElementById('setCompanyName').value.trim(),
        shortName: document.getElementById('setShortName').value.trim(),
        hotline1: document.getElementById('setHotline1').value.trim(),
        hotline2: document.getElementById('setHotline2').value.trim(),
        email: document.getElementById('setEmail').value.trim(),
        address: document.getElementById('setAddress').value.trim(),
        announcement: document.getElementById('setAnnouncement').value.trim(),
        announcementActive: document.getElementById('setAnnouncementActive').checked
      };

      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: updatedSettings })
        });
        const json = await res.json();
        if (json.success) {
          state.data.settings = json.settings;
          showToast('✅ Cấu hình doanh nghiệp đã được lưu thành công!', 'success');
        } else {
          showToast(json.message || 'Lỗi lưu cấu hình', 'error');
        }
      } catch (err) {
        state.data.settings = updatedSettings;
        showToast('Đã lưu cấu hình (chế độ cục bộ)!', 'success');
      } finally {
        btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu Thay Đổi Cấu Hình';
        btnSave.disabled = false;
      }
    });
  }

  // =========================================================================
  // 9. MODALS CLOSE CONTROLLER
  // =========================================================================
  document.querySelectorAll('.modal-close-btn, .btn-modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('open');
    }
  });

  // =========================================================================
  // 10. REAL-TIME AUTO-POLLING (EVERY 15 SECONDS)
  // =========================================================================
  setInterval(async () => {
    if (!state.token) return;
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const fresh = await res.json();
        const prevLeadsCount = (state.data.leads || []).length;
        const newLeadsCount = (fresh.leads || []).length;

        if (newLeadsCount > prevLeadsCount) {
          const newest = fresh.leads[0];
          showToast(`🔔 CÓ ĐƠN MỚI: ${newest.fullName} (${newest.phone}) vừa đặt lịch khảo sát!`, 'gold');
          playNotificationSound();
        }

        state.data = fresh;
        updateBadgeCounts();
        if (state.activeTab === 'leads') renderLeads();
        if (state.activeTab === 'overview') renderOverview();
      }
    } catch (e) {
      // Ignore background fetch error
    }
  }, 15000);

  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy
    }
  }

  // =========================================================================
  // 11. TOAST NOTIFICATION UTILITY
  // =========================================================================
  function showToast(message, type = 'success') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;

    let icon = '<i class="fa-solid fa-circle-check" style="color: var(--primary-light);"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-danger);"></i>';
    if (type === 'gold') icon = '<i class="fa-solid fa-bell" style="color: var(--accent-gold);"></i>';

    toast.innerHTML = `
      ${icon}
      <span style="flex: 1; line-height: 1.4;">${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Helper formatting functions
  function formatVNDNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Default fallback data if API unreachable
  function getDefaultFallbackData() {
    return {
      settings: {
        companyName: "Công ty TNHH Trung Vạn Niên",
        hotline1: "0927 776 789",
        hotline2: "0938 333 456",
        address: "Khu Công Nghiệp Châu Sơn, Phường Châu Sơn, Tỉnh Ninh Bình"
      },
      prices: [],
      leads: [],
      commissionTiers: []
    };
  }

  // Start Auth Flow
  initAuth();
});
