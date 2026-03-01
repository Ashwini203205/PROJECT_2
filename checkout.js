// ===== Checkout Page Logic =====
let shippingCost = 0;
let discount = 0;
const COUPONS = { 'NOVA10': { type: 'percent', value: 10 }, 'FIRST20': { type: 'percent', value: 20 }, 'SAVE500': { type: 'flat', value: 500 } };

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('scroll', () => { document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50); });

    if (cart.items.length === 0) {
        document.getElementById('checkout-layout').style.display = 'none';
        document.getElementById('checkout-empty').style.display = 'flex';
        return;
    }

    renderCheckoutItems();

    // Shipping radio handlers
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.shipping-option').forEach(o => o.classList.remove('active'));
            e.target.closest('.shipping-option').classList.add('active');
            const costs = { standard: 0, express: 199, overnight: 499 };
            shippingCost = costs[e.target.value] || 0;
            updateSummary();
        });
    });

    cart.renderCartSidebar();
});

function renderCheckoutItems() {
    const container = document.getElementById('checkout-items');
    container.innerHTML = '';
    cart.items.forEach(item => {
        container.innerHTML += `
            <div class="checkout-item">
                <div class="checkout-item-img"><img src="${item.image}" alt="${item.name}"></div>
                <div class="checkout-item-info">
                    <div class="checkout-item-name">${item.name}</div>
                    <div class="checkout-item-qty">Qty: ${item.qty}</div>
                </div>
                <div class="checkout-item-price">${formatCurrency(item.price * item.qty)}</div>
            </div>`;
    });
    updateSummary();
}

function updateSummary() {
    const subtotal = cart.getTotal();
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shippingCost + tax - discount;

    document.getElementById('summary-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('summary-shipping').textContent = shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost);
    document.getElementById('summary-tax').textContent = formatCurrency(tax);
    document.getElementById('summary-total').textContent = formatCurrency(total);

    if (discount > 0) {
        document.getElementById('discount-row').style.display = 'flex';
        document.getElementById('summary-discount').textContent = '-' + formatCurrency(discount);
    }
}

function applyCoupon() {
    const code = document.getElementById('coupon-input').value.trim().toUpperCase();
    const coupon = COUPONS[code];
    if (!coupon) { showToast('error', 'Invalid coupon code'); return; }
    const subtotal = cart.getTotal();
    discount = coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : coupon.value;
    updateSummary();
    showToast('success', `Coupon ${code} applied! You saved ${formatCurrency(discount)}`);
}

function proceedToPayment() {
    const form = document.getElementById('shipping-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    // Save shipping info
    const shippingInfo = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pincode: document.getElementById('pincode').value,
        country: 'India',
        shippingMethod: document.querySelector('input[name="shipping"]:checked').value,
        shippingCost,
        discount,
        subtotal: cart.getTotal(),
        tax: Math.round(cart.getTotal() * 0.18),
        total: cart.getTotal() + shippingCost + Math.round(cart.getTotal() * 0.18) - discount
    };
    localStorage.setItem('novapay_shipping', JSON.stringify(shippingInfo));
    window.location.href = 'gateway.html';
}
