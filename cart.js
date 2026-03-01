// ===== NovaPay Cart System =====
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('novapay_cart') || '[]');
        this.updateBadge();
    }
    save() { localStorage.setItem('novapay_cart', JSON.stringify(this.items)); this.updateBadge(); }
    addItem(product, qty = 1) {
        const existing = this.items.find(i => i.id === product.id);
        if (existing) { existing.qty += qty; } else { this.items.push({ ...product, qty }); }
        this.save(); this.renderCartSidebar(); showToast('success', `${product.name} added to cart!`);
    }
    removeItem(productId) {
        this.items = this.items.filter(i => i.id !== productId);
        this.save(); this.renderCartSidebar();
    }
    updateQty(productId, qty) {
        const item = this.items.find(i => i.id === productId);
        if (item) { item.qty = Math.max(1, qty); this.save(); this.renderCartSidebar(); }
    }
    getTotal() { return this.items.reduce((sum, i) => sum + i.price * i.qty, 0); }
    getCount() { return this.items.reduce((sum, i) => sum + i.qty, 0); }
    clear() { this.items = []; this.save(); this.renderCartSidebar(); }
    updateBadge() {
        const badge = document.getElementById('cart-badge');
        if (badge) { const count = this.getCount(); badge.textContent = count; badge.classList.toggle('show', count > 0); }
    }
    renderCartSidebar() {
        const container = document.getElementById('cart-items');
        const footer = document.getElementById('cart-footer');
        const empty = document.getElementById('cart-empty');
        if (!container) return;
        // Remove existing cart items (not the empty state)
        container.querySelectorAll('.cart-item').forEach(el => el.remove());
        if (this.items.length === 0) {
            if (empty) empty.style.display = 'flex';
            if (footer) footer.style.display = 'none';
            return;
        }
        if (empty) empty.style.display = 'none';
        if (footer) footer.style.display = 'block';
        this.items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <div class="cart-item-img"><img src="${item.image}" alt="${item.name}"></div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatCurrency(item.price)}</div>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="cart.updateQty(${item.id}, ${item.qty - 1})">−</button>
                        <span class="qty-value">${item.qty}</span>
                        <button class="qty-btn" onclick="cart.updateQty(${item.id}, ${item.qty + 1})">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="cart.removeItem(${item.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>`;
            container.appendChild(el);
        });
        const totalEl = document.getElementById('cart-total-value');
        if (totalEl) totalEl.textContent = formatCurrency(this.getTotal());
    }
}

const cart = new Cart();

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    const isOpen = sidebar.classList.contains('show');
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
    document.body.style.overflow = isOpen ? '' : 'hidden';
    if (!isOpen) cart.renderCartSidebar();
}

function toggleMobileMenu() {
    document.getElementById('nav-links').classList.toggle('show');
}

function showToast(type, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}
