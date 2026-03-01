// ===== Transaction Terminal Simulation =====
(function () {
    const output = document.getElementById('terminal-output');
    if (!output) return;
    const messages = [
        { level: 'info', msg: '[PaymentEngine] Initializing C++ payment processor v3.2.1...' },
        { level: 'success', msg: '[PaymentEngine] ✓ Engine initialized. AES-256 encryption active.' },
        { level: 'info', msg: '[Java:PaymentController] Spring Boot server started on port 8443' },
        { level: 'info', msg: '[Java:AuthService] JWT token validation middleware loaded' },
        { level: 'success', msg: '[Stripe] Sandbox API connected — pk_test_...demo_key' },
        { level: 'success', msg: '[PayPal] Sandbox environment ready — sb-XXXXX@business.example.com' },
        { level: 'info', msg: '[C++:FraudDetector] ML fraud detection model loaded (accuracy: 99.2%)' },
        { level: 'warn', msg: '[Sandbox] Running in TEST MODE — No real charges will be made' },
        { level: 'info', msg: `[Transaction] TXN_${Math.random().toString(36).substr(2, 8).toUpperCase()} — Card ending 4242 — ₹12,999 — AUTHORIZED` },
        { level: 'success', msg: `[Transaction] TXN_${Math.random().toString(36).substr(2, 8).toUpperCase()} — PayPal — ₹24,999 — COMPLETED` },
        { level: 'info', msg: '[C++:Validator] Card BIN check passed — Visa — Issuer: HDFC Bank' },
        { level: 'success', msg: '[Java:OrderService] Order ORD-M2X9K created and confirmed' },
        { level: 'info', msg: `[Transaction] TXN_${Math.random().toString(36).substr(2, 8).toUpperCase()} — UPI — ₹7,999 — PROCESSING` },
        { level: 'success', msg: `[Transaction] TXN_${Math.random().toString(36).substr(2, 8).toUpperCase()} — UPI — ₹7,999 — SUCCESS` },
        { level: 'warn', msg: '[C++:FraudDetector] Suspicious velocity detected — Rate limiting applied' },
        { level: 'info', msg: '[Java:WebhookService] Stripe webhook received: payment_intent.succeeded' },
        { level: 'success', msg: '[Java:NotificationService] Email confirmation sent to customer' },
        { level: 'info', msg: `[Transaction] TXN_${Math.random().toString(36).substr(2, 8).toUpperCase()} — Net Banking (SBI) — ₹49,999 — COMPLETED` },
        { level: 'info', msg: '[C++:Encryption] Transaction data encrypted and stored securely' },
        { level: 'success', msg: '[System] All services healthy — Uptime: 99.97% — Avg response: 142ms' },
    ];
    let idx = 0;
    function addLine() {
        const m = messages[idx % messages.length];
        const now = new Date();
        const ts = now.toTimeString().split(' ')[0];
        const line = document.createElement('div');
        line.className = 'line';
        line.innerHTML = `<span class="timestamp">${ts}</span><span class="level-${m.level}">[${m.level.toUpperCase()}]</span><span class="message">${m.msg}</span>`;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
        if (output.children.length > 25) output.removeChild(output.firstChild);
        idx++;
        setTimeout(addLine, 1500 + Math.random() * 2000);
    }
    // Start after delay
    setTimeout(addLine, 1000);
})();
