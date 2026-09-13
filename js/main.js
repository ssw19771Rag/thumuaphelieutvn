/**
 * THƯƠNG HIỆU THU MUA PHẾ LIỆU TRUNG VẠN NIÊN (TVN) - CORE ENGINE
 * Hiệu ứng xe tải cuộn theo đường, bộ lọc bảng giá, công cụ tính dự toán
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. HERO TRUCK ROAD ANIMATION ENGINE (YÊU CẦU BẮT BUỘC)
     Xe tải xanh TVN chạy dọc theo con đường uốn lượn qua các trạm phế liệu
     ========================================================================== */
  const truckStage = document.getElementById('truckStage');
  const roadWrapper = document.getElementById('roadWrapper');
  const roadSvg = document.getElementById('roadSvg');
  const roadPathCenter = document.getElementById('roadPathCenter');
  const tvnTruck = document.getElementById('tvnTruck');
  const truckSlider = document.getElementById('truckSlider');
  const truckAutoBtn = document.getElementById('truckAutoBtn');
  const truckAutoIcon = document.getElementById('truckAutoIcon');
  const truckAutoText = document.getElementById('truckAutoText');
  const nextStationLabel = document.getElementById('nextStationLabel');
  const stations = document.querySelectorAll('.scrap-station');

  // Station definitions with coordinates and metadata matching exact source prices
  const stationData = [
    { index: 0, percent: 8, name: '1. Giấy Carton', price: '5.8k – 9.8k/kg' },
    { index: 1, percent: 25, name: '2. Sắt Thép', price: '9k – 39.5k/kg' },
    { index: 2, percent: 44, name: '3. Nhôm Xingfa', price: '52k – 110k/kg' },
    { index: 3, percent: 62, name: '4. Đồng Cáp & Đỏ', price: '265k – 495k/kg' },
    { index: 4, percent: 80, name: '5. Inox 304', price: '45k – 98k/kg' },
    { index: 5, percent: 96, name: '6. Nhựa Tái Chế', price: '15k – 49k/kg' }
  ];

  let currentProgress = 0; // 0 to 100
  let targetProgress = 0;  // For smooth interpolation
  let lastProgress = 0;
  let isAutoPlaying = false;
  let autoPlayDirection = 1;
  let autoPlaySpeed = 0.15; // smooth pace
  let pathTotalLength = 0;
  let motionTimeout = null;

  // Initialize SVG Path length
  if (roadPathCenter) {
    try {
      pathTotalLength = roadPathCenter.getTotalLength();
    } catch (e) {
      pathTotalLength = 1250;
    }
  }

  // Function to update truck position and station proximity
  function updateTruckPosition(percent, isUserInteracting = false) {
    if (!roadPathCenter || !tvnTruck || !roadWrapper) return;

    // Constrain percent 0 to 100
    percent = Math.max(0, Math.min(100, percent));
    currentProgress = percent;

    if (truckSlider && !isUserInteracting) {
      truckSlider.value = percent;
    }

    const wrapperRect = roadWrapper.getBoundingClientRect();
    const svgWidth = 1200;
    const svgHeight = 320;
    
    // Calculate distance along SVG path
    const distance = (percent / 100) * pathTotalLength;
    const point = roadPathCenter.getPointAtLength(distance);

    // Calculate tangent slope angle (dy, dx) for natural vehicle tilt
    const delta = 3;
    const pPrev = roadPathCenter.getPointAtLength(Math.max(0, distance - delta));
    const pNext = roadPathCenter.getPointAtLength(Math.min(pathTotalLength, distance + delta));
    
    const dx = pNext.x - pPrev.x;
    const dy = pNext.y - pPrev.y;
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI);

    // Clamp tilt angle to prevent excessive steepness
    angleDeg = Math.max(-28, Math.min(28, angleDeg));

    // Convert SVG coordinates to DOM wrapper percentage / pixels
    const posX = (point.x / svgWidth) * wrapperRect.width;
    const posY = (point.y / svgHeight) * wrapperRect.height;

    // Determine direction for wheel rotation and exhaust
    const isMovingForward = percent >= lastProgress;
    const movementDiff = Math.abs(percent - lastProgress);

    if (movementDiff > 0.05) {
      tvnTruck.classList.add('driving');
      if (!isMovingForward) {
        tvnTruck.classList.add('driving-reverse');
      } else {
        tvnTruck.classList.remove('driving-reverse');
      }

      clearTimeout(motionTimeout);
      motionTimeout = setTimeout(() => {
        tvnTruck.classList.remove('driving', 'driving-reverse');
      }, 250);
    }

    // Offset truck center so wheels sit naturally on the road surface
    const truckOffsetX = -75; // half width (150px)
    const truckOffsetY = -65; // wheel alignment point

    tvnTruck.style.transform = `translate3d(${posX + truckOffsetX}px, ${posY + truckOffsetY}px, 0) rotate(${angleDeg}deg)`;

    // Check proximity to Scrap Stations (threshold ~6.5%)
    let closestStation = stationData[0];
    let minDistance = 999;

    stations.forEach((stationEl, idx) => {
      const sData = stationData[idx];
      const dist = Math.abs(percent - sData.percent);

      if (dist < minDistance) {
        minDistance = dist;
        closestStation = sData;
      }

      if (dist <= 6.5) {
        stationEl.classList.add('active');
      } else {
        stationEl.classList.remove('active');
      }
    });

    // Update live next station label on the truck badge
    if (nextStationLabel && closestStation) {
      nextStationLabel.textContent = `${closestStation.name} (${closestStation.price})`;
    }

    lastProgress = percent;
  }

  // Scroll-linked animation listener (Cuộn chuột để di chuyển xe tải)
  function handleScrollLinkedTruck() {
    if (isAutoPlaying || !truckStage) return;

    const rect = truckStage.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // When truck stage enters viewport
    if (rect.top <= windowHeight && rect.bottom >= 0) {
      // Map scroll progress across the hero section
      const totalScrollDistance = windowHeight + rect.height;
      const currentScroll = windowHeight - rect.top;
      let ratio = currentScroll / totalScrollDistance;

      // Expand the responsive driving range
      ratio = (ratio - 0.2) / 0.65;
      ratio = Math.max(0, Math.min(1, ratio));

      targetProgress = ratio * 100;
      updateTruckPosition(targetProgress);
    }
  }

  window.addEventListener('scroll', handleScrollLinkedTruck, { passive: true });
  window.addEventListener('resize', () => updateTruckPosition(currentProgress), { passive: true });

  // Range Slider manual scrubber
  if (truckSlider) {
    truckSlider.addEventListener('input', (e) => {
      isAutoPlaying = false;
      resetAutoPlayState();
      updateTruckPosition(parseFloat(e.target.value), true);
    });
  }

  // Click on any station beacon moves the truck directly to that station
  stations.forEach((st, index) => {
    st.addEventListener('click', () => {
      isAutoPlaying = false;
      resetAutoPlayState();
      const targetPercent = stationData[index].percent;
      smoothGlideTo(targetPercent);
    });
  });

  // Smooth glide helper function
  function smoothGlideTo(target) {
    const start = currentProgress;
    const diff = target - start;
    const duration = 650;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progressRatio = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progressRatio, 3);
      const val = start + diff * ease;
      updateTruckPosition(val);

      if (progressRatio < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  // Auto-play toggle
  if (truckAutoBtn) {
    truckAutoBtn.addEventListener('click', () => {
      isAutoPlaying = !isAutoPlaying;
      if (isAutoPlaying) {
        truckAutoIcon.className = 'fa-solid fa-pause';
        truckAutoText.textContent = 'Tạm dừng';
        runAutoPlayLoop();
      } else {
        resetAutoPlayState();
      }
    });
  }

  function resetAutoPlayState() {
    if (truckAutoIcon && truckAutoText) {
      truckAutoIcon.className = 'fa-solid fa-play';
      truckAutoText.textContent = 'Tự động chạy';
    }
    isAutoPlaying = false;
  }

  function runAutoPlayLoop() {
    if (!isAutoPlaying) return;

    currentProgress += autoPlaySpeed * autoPlayDirection;

    if (currentProgress >= 100) {
      currentProgress = 100;
      autoPlayDirection = -1; // reverse back
    } else if (currentProgress <= 0) {
      currentProgress = 0;
      autoPlayDirection = 1; // forward
    }

    updateTruckPosition(currentProgress);
    requestAnimationFrame(runAutoPlayLoop);
  }

  // Initial render of truck at start station
  setTimeout(() => {
    updateTruckPosition(8);
  }, 150);


  /* ==========================================================================
     2. SCRAP CARDS 3D LIFT ON SCROLL ("TỰ ĐẨY LÊN KHI LƯỚT ĐẾN")
     ========================================================================== */
  const liftCards = document.querySelectorAll('.scrap-lift-card');
  if ('IntersectionObserver' in window) {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // Slight stagger effect when scrolling into view
          setTimeout(() => {
            entry.target.classList.add('in-view');
          }, idx * 60);
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    }, {
      threshold: 0.25,
      rootMargin: '0px 0px -40px 0px'
    });

    liftCards.forEach(card => cardObserver.observe(card));
  }


  /* ==========================================================================
     3. LIVE SEARCH & CATEGORY FILTER FOR PRICE LIST
     ========================================================================== */
  const scrapSearchInput = document.getElementById('scrapSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryPills = document.querySelectorAll('.pill-btn');
  const scrapCards = document.querySelectorAll('.scrap-lift-card');
  const tableRows = document.querySelectorAll('#detailedPriceTable tbody tr');
  const tableEmptyState = document.getElementById('tableEmptyState');
  const detailedPriceTable = document.getElementById('detailedPriceTable');

  let activeCategory = 'all';
  let searchQuery = '';

  function filterScrapItems() {
    let visibleCards = 0;
    let visibleRows = 0;
    const query = searchQuery.trim().toLowerCase();

    // 1. Filter Visual Lift Cards
    scrapCards.forEach(card => {
      const cardCat = card.getAttribute('data-category');
      const cardText = card.textContent.toLowerCase();

      const matchCat = (activeCategory === 'all' || cardCat === activeCategory);
      const matchSearch = (!query || cardText.includes(query));

      if (matchCat && matchSearch) {
        card.style.display = 'flex';
        visibleCards++;
      } else {
        card.style.display = 'none';
      }
    });

    // 2. Filter Table Rows
    tableRows.forEach(row => {
      const rowCat = row.getAttribute('data-category');
      const rowText = row.textContent.toLowerCase();

      const matchCat = (activeCategory === 'all' || rowCat === activeCategory);
      const matchSearch = (!query || rowText.includes(query));

      if (matchCat && matchSearch) {
        row.style.display = '';
        visibleRows++;
      } else {
        row.style.display = 'none';
      }
    });

    // Show empty state if neither card nor row is visible
    if (tableEmptyState && detailedPriceTable) {
      if (visibleRows === 0 && query) {
        tableEmptyState.style.display = 'block';
        detailedPriceTable.style.display = 'none';
      } else {
        tableEmptyState.style.display = 'none';
        detailedPriceTable.style.display = 'table';
      }
    }
  }

  // Category Pill Clicks
  categoryPills.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryPills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-filter');
      filterScrapItems();
    });
  });

  // Search Input listener
  if (scrapSearchInput) {
    scrapSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      }
      filterScrapItems();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      scrapSearchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      filterScrapItems();
      scrapSearchInput.focus();
    });
  }

  /* ==========================================================================
     3.1. INTERACTIVE COLUMN HOVER HIGHLIGHT EFFECT (LÀM NỔI THEO TỪNG CỘT)
     ========================================================================== */
  if (detailedPriceTable) {
    const tableCells = detailedPriceTable.querySelectorAll('th[data-col], td[data-col]');

    tableCells.forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        const colIndex = cell.getAttribute('data-col');
        if (!colIndex) return;

        // Highlight all headers and cells with matching data-col
        const matchingCells = detailedPriceTable.querySelectorAll(`[data-col="${colIndex}"]`);
        matchingCells.forEach(c => c.classList.add('col-highlighted'));
      });

      cell.addEventListener('mouseleave', () => {
        const colIndex = cell.getAttribute('data-col');
        if (!colIndex) return;

        const matchingCells = detailedPriceTable.querySelectorAll(`[data-col="${colIndex}"]`);
        matchingCells.forEach(c => c.classList.remove('col-highlighted'));
      });
    });
  }


  /* ==========================================================================
     3.2. BỐ CỤC SO LE TRÁI - PHẢI: HIỆU ỨNG TRÀN RA KHI LĂN CHUỘT (EXPAND-REVEAL)
     ========================================================================== */
  const expandRows = document.querySelectorAll('.expand-reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          // Keep it expanded once in view
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    expandRows.forEach(row => revealObserver.observe(row));
  } else {
    // Fallback if browser doesn't support IntersectionObserver
    expandRows.forEach(row => row.classList.add('is-revealed'));
  }


  /* ==========================================================================
     4. CÔNG CỤ DỰ TOÁN GIÁ PHẾ LIỆU THÔNG MINH (ESTIMATOR)
     ========================================================================== */
  const calcScrapType = document.getElementById('calcScrapType');
  const calcWeight = document.getElementById('calcWeight');
  const calcWeightUnit = document.getElementById('calcWeightUnit');
  const resultAmountDisplay = document.getElementById('resultAmountDisplay');
  const displayWeight = document.getElementById('displayWeight');
  const displayPriceRange = document.getElementById('displayPriceRange');
  const displayCommission = document.getElementById('displayCommission');
  const presetButtons = document.querySelectorAll('.btn-preset');
  const quickCalcButtons = document.querySelectorAll('.btn-quick-calc');

  function calculateEstimate() {
    if (!calcScrapType || !calcWeight || !resultAmountDisplay) return;

    const selectedOption = calcScrapType.options[calcScrapType.selectedIndex];
    const minPrice = parseFloat(selectedOption.getAttribute('data-min')) || 10000;
    const maxPrice = parseFloat(selectedOption.getAttribute('data-max')) || 20000;

    let weight = parseFloat(calcWeight.value) || 0;
    const unit = calcWeightUnit.value;

    // Convert tons to kg for accurate calculation
    const weightInKg = (unit === 'ton') ? (weight * 1000) : weight;

    // Calculate Min & Max payout
    const minPayout = weightInKg * minPrice;
    const maxPayout = weightInKg * maxPrice;

    // Format currency string (VNĐ)
    const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(Math.round(num));

    resultAmountDisplay.innerHTML = `${formatVND(minPayout)} – ${formatVND(maxPayout)} <small>VNĐ</small>`;

    if (displayWeight) {
      displayWeight.textContent = `${formatVND(weight)} ${unit === 'ton' ? 'Tấn' : 'kg'}`;
    }

    if (displayPriceRange) {
      displayPriceRange.textContent = `${formatVND(minPrice)} – ${formatVND(maxPrice)} đ/kg`;
    }

    // Estimate commission based on exact TVN policy tiers
    if (displayCommission) {
      if (weightInKg < 500) {
        displayCommission.textContent = '500.000 – 1.500.000 đ';
      } else if (weightInKg <= 1000) {
        displayCommission.textContent = '3.000.000 – 5.000.000 đ';
      } else if (weightInKg <= 5000) {
        displayCommission.textContent = '6.000.000 – 12.000.000 đ';
      } else if (weightInKg <= 10000) {
        displayCommission.textContent = '15.000.000 – 30.000.000 đ';
      } else if (weightInKg <= 30000) {
        displayCommission.textContent = '35.000.000 – 60.000.000 đ';
      } else {
        displayCommission.textContent = '60.000.000 – 100.000.000 đ+';
      }
    }
  }

  if (calcScrapType) calcScrapType.addEventListener('change', calculateEstimate);
  if (calcWeight) calcWeight.addEventListener('input', calculateEstimate);
  if (calcWeightUnit) calcWeightUnit.addEventListener('change', calculateEstimate);

  // Preset Buttons (100kg, 500kg, 1 tấn, 5 tấn, 10 tấn)
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.getAttribute('data-val'));
      if (val >= 1000) {
        calcWeight.value = val / 1000;
        calcWeightUnit.value = 'ton';
      } else {
        calcWeight.value = val;
        calcWeightUnit.value = 'kg';
      }
      calculateEstimate();
    });
  });

  // "Tính tiền" click from scrap cards
  quickCalcButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.getAttribute('data-type');
      
      // Select corresponding option in estimator dropdown
      for (let i = 0; i < calcScrapType.options.length; i++) {
        if (calcScrapType.options[i].value.includes(type)) {
          calcScrapType.selectedIndex = i;
          break;
        }
      }

      calculateEstimate();

      // Smooth scroll to estimator
      const estimatorEl = document.getElementById('tinh-gia');
      if (estimatorEl) {
        estimatorEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Run initial calculation
  calculateEstimate();


  /* ==========================================================================
     5. FAQ ACCORDION INTERACTION
     ========================================================================== */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close other items
        faqItems.forEach(i => i.classList.remove('active'));
        // Toggle current
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });


  /* ==========================================================================
     6. BOOKING FORM SUBMISSION & TOAST NOTIFICATION
     ========================================================================== */
  const bookingForm = document.getElementById('bookingForm');
  const formSuccessAlert = document.getElementById('formSuccessAlert');
  const submitBtn = document.getElementById('submitBtn');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fullName = document.getElementById('fullName').value.trim();
      const phoneNumber = document.getElementById('phoneNumber').value.trim();
      const locationArea = document.getElementById('locationArea').value.trim();
      const scrapCategoryEl = document.getElementById('scrapCategory');
      const scrapType = scrapCategoryEl ? scrapCategoryEl.options[scrapCategoryEl.selectedIndex].text : 'Phế liệu tổng hợp';
      const estimatedQtyEl = document.getElementById('estimatedQty');
      const estimatedWeight = estimatedQtyEl ? estimatedQtyEl.value.trim() : '';
      const notesEl = document.getElementById('notes');
      const note = notesEl ? notesEl.value.trim() : '';

      if (!fullName || !phoneNumber || !locationArea) {
        alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
        return;
      }

      // Send to Admin Backend API
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi yêu cầu...';

      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone: phoneNumber,
          location: locationArea,
          scrapType,
          estimatedWeight,
          note
        })
      }).catch(err => {
        console.warn('Saved locally (offline)', err);
      }).finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đã Gửi Thành Công';
        if (formSuccessAlert) {
          formSuccessAlert.style.display = 'flex';
          formSuccessAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        bookingForm.reset();

        // Re-enable after 5s
        setTimeout(() => {
          submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi Yêu Cầu Thu Mua Ngay';
        }, 5000);
      });
    });
  }


  /* ==========================================================================
     7. MOBILE DRAWER NAVIGATION & OVERLAY
     ========================================================================== */
  const menuToggle = document.getElementById('menuToggle');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerClose = document.getElementById('drawerClose');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  function openDrawer() {
    if (mobileDrawer && drawerOverlay) {
      mobileDrawer.classList.add('active');
      drawerOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDrawer() {
    if (mobileDrawer && drawerOverlay) {
      mobileDrawer.classList.remove('active');
      drawerOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (menuToggle) menuToggle.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
  drawerLinks.forEach(link => link.addEventListener('click', closeDrawer));


  /* ==========================================================================
     8. BACK TO TOP BUTTON & ACTIVE HEADER SCROLL
     ========================================================================== */
  const backToTopBtn = document.getElementById('backToTopBtn');
  const mainHeader = document.getElementById('mainHeader');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    // Back to top button visibility
    if (backToTopBtn) {
      if (scrollY > 380) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }

    // Header elevation
    if (mainHeader) {
      if (scrollY > 40) {
        mainHeader.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.08)';
      } else {
        mainHeader.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.04)';
      }
    }

    // Scroll spy for active nav link
    sections.forEach(sec => {
      const sectionHeight = sec.offsetHeight;
      const sectionTop = sec.offsetTop - 120;
      const sectionId = sec.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ==========================================================================
     9. FLOATING ZALO CHAT BOX WIDGET INTERACTION
     ========================================================================== */
  const zaloChatBox = document.getElementById('zaloChatBox');
  const zaloChatClose = document.getElementById('zaloChatClose');
  const zaloFloatBtn = document.getElementById('zaloFloatBtn');

  if (zaloChatClose && zaloChatBox) {
    zaloChatClose.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      zaloChatBox.classList.add('hidden');
      sessionStorage.setItem('tvn_zalo_box_closed', 'true');
    });
  }

  if (zaloFloatBtn && zaloChatBox) {
    zaloFloatBtn.addEventListener('click', (e) => {
      // If user closed the chat box previously, reopen it on float button click
      if (zaloChatBox.classList.contains('hidden')) {
        e.preventDefault();
        zaloChatBox.classList.remove('hidden');
        sessionStorage.removeItem('tvn_zalo_box_closed');
      }
    });
  }

  // Auto-hide if user already dismissed it during the session
  if (sessionStorage.getItem('tvn_zalo_box_closed') === 'true' && zaloChatBox) {
    zaloChatBox.classList.add('hidden');
  }

  /* ==========================================================================
     10. DESKTOP / MOBILE VIEWPORT MODE SWITCHER (BẬT/TẮT GIAO DIỆN)
     ========================================================================== */
  const viewportMeta = document.getElementById('viewportMeta') || document.querySelector('meta[name="viewport"]');
  const viewToggleBtns = document.querySelectorAll('.btn-toggle-view');

  function setViewMode(mode) {
    if (!viewportMeta) return;
    if (mode === 'desktop') {
      viewportMeta.setAttribute('content', 'width=1280, initial-scale=0.35, maximum-scale=3.0, user-scalable=yes');
      document.body.classList.add('forced-desktop-mode');
      localStorage.setItem('tvn_preferred_view', 'desktop');
      viewToggleBtns.forEach(btn => {
        btn.innerHTML = '<i class="fa-solid fa-mobile-screen"></i> <span>Chuyển về giao diện di động</span>';
      });
    } else {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0');
      document.body.classList.remove('forced-desktop-mode');
      localStorage.setItem('tvn_preferred_view', 'mobile');
      viewToggleBtns.forEach(btn => {
        btn.innerHTML = '<i class="fa-solid fa-desktop"></i> <span>Xem giao diện máy tính</span>';
      });
    }
  }

  // Restore user view preference if set, but default to mobile on small screens
  const savedView = localStorage.getItem('tvn_preferred_view');
  if (savedView === 'desktop' && window.innerWidth >= 860) {
    setViewMode('desktop');
  } else {
    setViewMode('mobile');
  }

  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isCurrentlyDesktop = document.body.classList.contains('forced-desktop-mode') || 
                                (viewportMeta && viewportMeta.getAttribute('content').includes('1280'));
      setViewMode(isCurrentlyDesktop ? 'mobile' : 'desktop');
      // If triggered from drawer, close drawer
      const mobileDrawer = document.getElementById('mobileDrawer');
      const drawerOverlay = document.getElementById('drawerOverlay');
      if (mobileDrawer && mobileDrawer.classList.contains('active')) {
        mobileDrawer.classList.remove('active');
        if (drawerOverlay) drawerOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

});

