// ===== NovaPay Main JS =====
document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Render featured products (first 8)
    const grid = document.getElementById('products-grid');
    if (grid) {
        const featured = PRODUCTS.slice(0, 8);
        featured.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card reveal';
            card.innerHTML = `
                <div class="product-card-img">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                    ${p.badge ? `<span class="product-card-badge">${p.badge}</span>` : ''}
                    <div class="product-card-actions">
                        <button class="product-card-action-btn" onclick="cart.addItem(PRODUCTS.find(x=>x.id===${p.id}))" title="Add to Cart">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                        </button>
                        <button class="product-card-action-btn" title="Quick View">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                    </div>
                </div>
                <div class="product-card-body">
                    <div class="product-card-category">${p.category}</div>
                    <div class="product-card-name">${p.name}</div>
                    <div class="product-card-desc">${p.description}</div>
                    <div class="product-card-footer">
                        <span class="product-card-price">${formatCurrency(p.price)}${p.originalPrice ? `<span class="product-card-price-old">${formatCurrency(p.originalPrice)}</span>` : ''}</span>
                        <button class="btn btn-sm btn-primary" onclick="cart.addItem(PRODUCTS.find(x=>x.id===${p.id}))">Add</button>
                    </div>
                </div>`;
            grid.appendChild(card);
        });
    }

    // Intersection Observer for reveal animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Counter animation
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count);
        let current = 0;
        const step = target / 60;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = Math.floor(current).toLocaleString() + '+';
        }, 30);
    });

    // Init cart sidebar
    cart.renderCartSidebar();
});
