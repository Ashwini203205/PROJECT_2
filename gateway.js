// ===== NovaPay Payment Gateway Logic =====
let currentMethod = 'card';
let selectedBank = null;
let orderInfo = {};

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('scroll', () => { document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50); });

    // Load order info
    const shipping = JSON.parse(localStorage.getItem('novapay_shipping') || '{}');
    orderInfo = shipping;

    // Render gateway items
    renderGatewayItems();

    // Card number formatting & live preview
    const cardNum = document.getElementById('card-number');
    const cardName = document.getElementById('card-name');
    const cardExpiry = document.getElementById('card-expiry');

    if (cardNum) {
        cardNum.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').substring(0, 16);
            let formatted = v.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = formatted;
            document.getElementById('card-number-display').textContent = formatted || '•••• •••• •••• ••••';
            // Detect brand
            const brand = detectCardBrand(v);
            document.getElementById('card-brand-display').textContent = brand;
            const icons = { VISA: '💳', MASTERCARD: '💳', AMEX: '💳', DISCOVER: '💳' };
            document.getElementById('card-brand-icon').textContent = icons[brand] || '💳';
        });
    }
    if (cardName) {
        cardName.addEventListener('input', (e) => {
            document.getElementById('card-holder-display').textContent = e.target.value.toUpperCase() || 'YOUR NAME';
        });
    }
    if (cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').substring(0, 4);
            if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
            e.target.value = v;
            document.getElementById('card-expiry-display').textContent = v || 'MM/YY';
        });
    }

    // UPI type toggle
    document.querySelectorAll('input[name="upi-type"]').forEach(r => {
        r.addEventListener('change', (e) => {
            document.querySelectorAll('.upi-option').forEach(o => o.classList.remove('active'));
            e.target.closest('.upi-option').classList.add('active');
            document.getElementById('upi-vpa-section').style.display = e.target.value === 'vpa' ? 'block' : 'none';
            document.getElementById('upi-qr-section').style.display = e.target.value === 'qr' ? 'block' : 'none';
            if (e.target.value === 'qr') generateQRCode();
        });
    });

    // Render banks
    const bankGrid = document.getElementById('bank-grid');
    if (bankGrid) {
        BANKS.forEach(bank => {
            const card = document.createElement('div');
            card.className = 'bank-card';
            card.innerHTML = `<span class="bank-icon">${bank.icon}</span><span>${bank.name}</span>`;
            card.onclick = () => selectBank(bank, card);
            bankGrid.appendChild(card);
        });
    }

    // 3D Secure trigger
    if (cardNum) {
        cardNum.addEventListener('blur', () => {
            const num = cardNum.value.replace(/\s/g, '');
            if (num.length >= 12) {
                document.getElementById('secure-3d').style.display = 'block';
            }
        });
    }

    cart.renderCartSidebar();
});

function renderGatewayItems() {
    const container = document.getElementById('gateway-items');
    if (!container) return;

    const total = orderInfo.total || cart.getTotal() + Math.round(cart.getTotal() * 0.18);
    document.getElementById('pay-amount').textContent = formatCurrency(total);

    container.innerHTML = '';
    cart.items.forEach(item => {
        container.innerHTML += `
            <div class="checkout-item">
                <div class="checkout-item-img"><img src="${item.image}" alt="${item.name}"></div>
                <div class="checkout-item-info"><div class="checkout-item-name">${item.name}</div><div class="checkout-item-qty">Qty: ${item.qty}</div></div>
                <div class="checkout-item-price">${formatCurrency(item.price * item.qty)}</div>
            </div>`;
    });

    const subtotal = orderInfo.subtotal || cart.getTotal();
    const shipping = orderInfo.shippingCost || 0;
    const tax = orderInfo.tax || Math.round(subtotal * 0.18);
    const disc = orderInfo.discount || 0;

    document.getElementById('gw-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('gw-shipping').textContent = shipping === 0 ? 'FREE' : formatCurrency(shipping);
    document.getElementById('gw-tax').textContent = formatCurrency(tax);
    document.getElementById('gw-total').textContent = formatCurrency(total);

    if (disc > 0) {
        document.getElementById('gw-discount-row').style.display = 'flex';
        document.getElementById('gw-discount').textContent = '-' + formatCurrency(disc);
    }

    // QR amount
    const qrAmountEl = document.getElementById('qr-amount');
    if (qrAmountEl) qrAmountEl.textContent = formatCurrency(total);
}

function detectCardBrand(num) {
    if (/^4/.test(num)) return 'VISA';
    if (/^5[1-5]/.test(num)) return 'MASTERCARD';
    if (/^3[47]/.test(num)) return 'AMEX';
    if (/^6(?:011|5)/.test(num)) return 'DISCOVER';
    return 'CARD';
}

function switchMethod(method) {
    currentMethod = method;
    document.querySelectorAll('.method-tab').forEach(t => t.classList.toggle('active', t.dataset.method === method));
    document.querySelectorAll('.method-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + method)?.classList.add('active');
}

function fillTestCard(num) {
    const input = document.getElementById('card-number');
    input.value = num.replace(/(.{4})/g, '$1 ').trim();
    input.dispatchEvent(new Event('input'));
    document.getElementById('card-name').value = 'TEST USER';
    document.getElementById('card-name').dispatchEvent(new Event('input'));
    document.getElementById('card-expiry').value = '12/28';
    document.getElementById('card-expiry').dispatchEvent(new Event('input'));
    document.getElementById('card-cvc').value = '123';
    document.getElementById('secure-3d').style.display = 'block';
    document.getElementById('card-otp').value = '123456';
    showToast('info', 'Test card filled! Click Pay to simulate.');
}

function selectBank(bank, el) {
    selectedBank = bank;
    document.querySelectorAll('.bank-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('nb-redirect-info').style.display = 'block';
    document.getElementById('selected-bank-name').textContent = bank.name;
}

function generateQRCode() {
    const qr = document.getElementById('qr-code');
    if (!qr) return;
    qr.innerHTML = '';
    // Generate a simple QR-like pattern
    const pattern = [];
    for (let i = 0; i < 21; i++) {
        for (let j = 0; j < 21; j++) {
            const isCorner = (i < 7 && j < 7) || (i < 7 && j > 13) || (i > 13 && j < 7);
            const isBorder = isCorner && (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4) || (i < 7 && (j === 0 || j === 6)) || (j < 7 && (i === 0 || i === 6)));
            const isDark = isCorner ? (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) : Math.random() > 0.5;
            const cell = document.createElement('div');
            cell.className = 'qr-cell ' + (isDark ? 'dark' : 'light');
            qr.appendChild(cell);
        }
    }
}

// ===== PAYMENT PROCESSING ENGINE =====
async function processPayment() {
    // Validate based on method
    if (currentMethod === 'card') {
        const num = document.getElementById('card-number').value.replace(/\s/g, '');
        const name = document.getElementById('card-name').value;
        const expiry = document.getElementById('card-expiry').value;
        const cvc = document.getElementById('card-cvc').value;
        if (!num || num.length < 13) { showToast('error', 'Please enter a valid card number'); return; }
        if (!name) { showToast('error', 'Please enter cardholder name'); return; }
        if (!expiry || expiry.length < 4) { showToast('error', 'Please enter expiry date'); return; }
        if (!cvc || cvc.length < 3) { showToast('error', 'Please enter CVC'); return; }
    } else if (currentMethod === 'paypal') {
        const email = document.getElementById('paypal-email').value;
        if (!email) { showToast('error', 'Please enter PayPal email'); return; }
    } else if (currentMethod === 'upi') {
        const upiType = document.querySelector('input[name="upi-type"]:checked').value;
        if (upiType === 'vpa') {
            const upiId = document.getElementById('upi-id').value;
            if (!upiId || !upiId.includes('@')) { showToast('error', 'Please enter a valid UPI ID'); return; }
        }
    } else if (currentMethod === 'netbanking') {
        if (!selectedBank) { showToast('error', 'Please select a bank'); return; }
    }

    // Show processing overlay
    const overlay = document.getElementById('processing-overlay');
    overlay.style.display = 'flex';

    // Disable pay button
    const btn = document.getElementById('pay-btn');
    btn.querySelector('.pay-btn-content').style.display = 'none';
    btn.querySelector('.pay-btn-loading').style.display = 'flex';
    btn.disabled = true;

    const log = document.getElementById('processing-log');
    log.innerHTML = '';

    // Determine if payment should succeed
    let shouldSucceed = true;
    let failReason = '';
    if (currentMethod === 'card') {
        const num = document.getElementById('card-number').value.replace(/\s/g, '');
        if (num === '4000000000000002') { shouldSucceed = false; failReason = 'Card declined by issuer'; }
        else if (num === '4000000000009995') { shouldSucceed = false; failReason = 'Insufficient funds'; }
        else if (num === '4000000000000069') { shouldSucceed = false; failReason = 'Expired card'; }
        else if (num === '4000000000000119') { shouldSucceed = false; failReason = 'Processing error'; }
    } else if (currentMethod === 'upi') {
        const upiId = document.getElementById('upi-id')?.value || '';
        if (upiId.startsWith('fail')) { shouldSucceed = false; failReason = 'UPI transaction failed'; }
    }

    // Processing steps
    const steps = [
        { id: 'step-validate', duration: 800, log: `[Java:PaymentController] Received ${currentMethod.toUpperCase()} payment request`, logAfter: `[Java:Validator] Input validation passed ✓` },
        { id: 'step-encrypt', duration: 600, log: '[C++:CryptoEngine] Generating AES-256-GCM session key...', logAfter: '[C++:CryptoEngine] Transaction data encrypted with key: 0x7F...A3 ✓' },
        { id: 'step-fraud', duration: 1000, log: '[C++:FraudDetector] Running ML fraud detection model...', logAfter: '[C++:FraudDetector] Risk score: 0.02 (LOW) — Transaction approved ✓' },
        { id: 'step-gateway', duration: 1200, log: `[Java:GatewayService] Connecting to ${currentMethod === 'paypal' ? 'PayPal Sandbox' : currentMethod === 'upi' ? 'UPI Gateway' : currentMethod === 'netbanking' ? 'Net Banking Gateway' : 'Stripe Test API'}...`, logAfter: shouldSucceed ? '[Gateway] Authorization received — Status: APPROVED ✓' : `[Gateway] Authorization FAILED — ${failReason} ✗` },
        { id: 'step-auth', duration: 700, log: shouldSucceed ? '[Java:OrderService] Creating order record...' : '[Java:ErrorHandler] Logging failed transaction...', logAfter: shouldSucceed ? `[Java:OrderService] Order ${generateOrderId()} confirmed ✓` : `[Java:ErrorHandler] Transaction declined — ${failReason}` },
    ];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const el = document.getElementById(step.id);
        el.classList.add('active');
        el.querySelector('.step-status').textContent = 'Processing...';
        addProcessingLog(log, step.log);
        await delay(step.duration);

        if (i === 3 && !shouldSucceed) {
            el.classList.remove('active');
            el.classList.add('error');
            el.querySelector('.step-status').textContent = 'Failed';
            addProcessingLog(log, step.logAfter);
            // Mark remaining as error
            const nextEl = document.getElementById(steps[4].id);
            nextEl.classList.add('error');
            nextEl.querySelector('.step-status').textContent = 'Aborted';
            await delay(1500);
            handlePaymentResult(false, failReason);
            return;
        }

        addProcessingLog(log, step.logAfter);
        el.classList.remove('active');
        el.classList.add('done');
        el.querySelector('.step-status').textContent = 'Complete';
    }

    await delay(500);
    handlePaymentResult(true);
}

function addProcessingLog(container, text) {
    const line = document.createElement('div');
    const ts = new Date().toTimeString().split(' ')[0];
    line.textContent = `[${ts}] ${text}`;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function handlePaymentResult(success, reason = '') {
    const txnId = generateTransactionId();
    const orderId = generateOrderId();
    const total = orderInfo.total || cart.getTotal() + Math.round(cart.getTotal() * 0.18);

    // Save order to history
    const orders = JSON.parse(localStorage.getItem('novapay_orders') || '[]');
    const order = {
        orderId, txnId, status: success ? 'completed' : 'failed',
        method: currentMethod, amount: total, date: new Date().toISOString(),
        items: [...cart.items], shipping: orderInfo, reason: reason || null
    };
    orders.unshift(order);
    localStorage.setItem('novapay_orders', JSON.stringify(orders));

    if (success) {
        // Clear cart
        cart.clear();
        localStorage.removeItem('novapay_shipping');
        // Redirect to success page
        localStorage.setItem('novapay_last_order', JSON.stringify(order));
        window.location.href = 'orders.html?status=success&order=' + orderId;
    } else {
        // Hide overlay and show error
        document.getElementById('processing-overlay').style.display = 'none';
        resetProcessingSteps();
        const btn = document.getElementById('pay-btn');
        btn.querySelector('.pay-btn-content').style.display = 'flex';
        btn.querySelector('.pay-btn-loading').style.display = 'none';
        btn.disabled = false;
        showToast('error', `Payment failed: ${reason}`);
    }
}

function resetProcessingSteps() {
    document.querySelectorAll('.processing-step').forEach(s => {
        s.classList.remove('active', 'done', 'error');
        s.querySelector('.step-status').textContent = 'Pending';
    });
}
