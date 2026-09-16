// Cozmo Cafe & Bistro - Core Controller
// ponytail: Dynamic categories directly from dataset + instant search + zero-backend WhatsApp booking
const DATA_SOURCE = 'menu.json';
const CAFE_PHONE = '8801819339966';
const PAGE_SIZE = 8;

let allMenuItems = [];
let activeCategory = 'all';
let searchQuery = '';
let visibleCount = PAGE_SIZE;

async function loadMenu() {
  const container = document.getElementById('menu-container');
  try {
    const res = await fetch(DATA_SOURCE);
    if (!res.ok) throw new Error('Failed to load menu');
    allMenuItems = await res.json();
    renderCategories();
    renderMenu();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="menu-loading">Failed to load menu. Please call +8801819339966 directly.</p>`;
  }
}

function renderCategories() {
  const filterWrap = document.getElementById('category-filters');
  if (!filterWrap) return;

  const categories = ['all', ...new Set(allMenuItems.map(i => i.category))];
  filterWrap.innerHTML = categories.map(cat => `
    <button class="filter-pill ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">
      ${cat === 'all' ? 'All Items (' + allMenuItems.length + ')' : cat}
    </button>
  `).join('');

  filterWrap.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      filterWrap.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      visibleCount = PAGE_SIZE;
      renderMenu();
    });
  });
}

function renderMenu() {
  const container = document.getElementById('menu-container');
  const actionsContainer = document.getElementById('menu-actions');
  let filtered = allMenuItems;

  if (activeCategory !== 'all') {
    filtered = filtered.filter(i => i.category === activeCategory);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.category.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div class="menu-empty" style="grid-column: 1 / -1; text-align: center; padding: 40px 0;">
        <p class="menu-loading">No delicacies match "${searchQuery || activeCategory}".</p>
        <button id="reset-filter-btn" class="btn btn-outline" style="margin-top: 14px;">Reset All Filters</button>
      </div>`;
    if (actionsContainer) actionsContainer.innerHTML = '';
    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        searchQuery = '';
        activeCategory = 'all';
        visibleCount = PAGE_SIZE;
        const searchInput = document.getElementById('menu-search');
        if (searchInput) searchInput.value = '';
        renderCategories();
        renderMenu();
      };
    }
    return;
  }

  const visibleItems = filtered.slice(0, visibleCount);

  container.innerHTML = visibleItems.map(item => `
    <article class="menu-card" data-category="${item.category}">
      <div class="card-img-wrap">
        <img src="${item.imageUrl}" alt="${item.name}" loading="lazy" onerror="this.onerror=null;this.src='cozmo_resources/cozmo_cover.jpg'">
        ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-header-row">
          <h3 class="card-title">${item.name}</h3>
          <span class="card-price">${item.price}</span>
        </div>
        <div class="card-meta"><span class="cat-tag">${item.category}</span></div>
      </div>
    </article>
  `).join('');

  renderMenuActions(filtered.length);
}

function renderMenuActions(totalCount) {
  const actionsContainer = document.getElementById('menu-actions');
  if (!actionsContainer) return;

  if (totalCount <= PAGE_SIZE) {
    actionsContainer.innerHTML = '';
    return;
  }

  if (visibleCount < totalCount) {
    const remaining = totalCount - visibleCount;
    const nextBatch = Math.min(PAGE_SIZE, remaining);
    actionsContainer.innerHTML = `
      <button id="load-more-btn" class="btn btn-primary">Load More (+${nextBatch})</button>
      <button id="show-all-btn" class="btn btn-outline">View All (${totalCount})</button>
    `;
    document.getElementById('load-more-btn').addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      renderMenu();
    });
    document.getElementById('show-all-btn').addEventListener('click', () => {
      visibleCount = totalCount;
      renderMenu();
    });
  } else {
    actionsContainer.innerHTML = `
      <button id="show-less-btn" class="btn btn-outline">Show Less ↑</button>
    `;
    document.getElementById('show-less-btn').addEventListener('click', () => {
      visibleCount = PAGE_SIZE;
      renderMenu();
      const menuSection = document.getElementById('menu');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

function setupSearch() {
  const searchInput = document.getElementById('menu-search');
  if (!searchInput) return;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    visibleCount = PAGE_SIZE;
    renderMenu();
  });
}

function setupReservation() {
  const form = document.getElementById('reservation-form');
  if (!form) return;

  const dateInput = document.getElementById('res-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('res-name').value.trim();
    const phone = document.getElementById('res-phone').value.trim();
    const date = document.getElementById('res-date').value;
    const time = document.getElementById('res-time').value;
    const guests = document.getElementById('res-guests').value;
    const notes = document.getElementById('res-notes').value.trim();

    const msg = 
`🍽️ *Reservation Request - Cozmo Cafe & Bistro*
*Location:* Rupayan Shopping Square (2nd Floor), Basundhara R/A
*Guest Name:* ${name}
*Phone:* ${phone}
*Date:* ${date}
*Time:* ${time}
*Party Size:* ${guests}
${notes ? `*Special Request:* ${notes}` : ''}`;

    const waUrl = `https://wa.me/${CAFE_PHONE}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  });
}

function setupUI() {
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mainNav.classList.toggle('active');
    });
    mainNav.querySelectorAll('a').forEach(l => l.addEventListener('click', () => mainNav.classList.remove('active')));
    document.addEventListener('click', (e) => {
      if (mainNav.classList.contains('active') && !mainNav.contains(e.target)) {
        mainNav.classList.remove('active');
      }
    });
  }

  const closeBanner = document.getElementById('close-banner');
  const promoBanner = document.getElementById('promo-banner');
  if (closeBanner && promoBanner) {
    closeBanner.addEventListener('click', () => promoBanner.style.display = 'none');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  setupSearch();
  setupReservation();
  setupUI();
});
