/**
 * =====================================================
 * NovaPay - Payment Controller (Java Backend)
 * =====================================================
 * Simulated Spring Boot REST Controller for payment
 * processing, order management, and API orchestration.
 * 
 * Technology: Java 17+ / Spring Boot 3.x
 * Architecture: RESTful Microservice
 * =====================================================
 */

package com.novapay.controller;

import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.security.MessageDigest;
import java.security.SecureRandom;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

// Simulated Spring Boot annotations (for demonstration)
// @RestController
// @RequestMapping("/api/v1/payments")
// @CrossOrigin(origins = "*")
public class PaymentController {

    // ===== Configuration =====
    private static final String STRIPE_TEST_KEY = "pk_test_NovaPay_Demo_Key_2026";
    private static final String PAYPAL_SANDBOX_CLIENT = "sb-XXXXX123456@business.example.com";
    private static final String ENCRYPTION_ALGORITHM = "AES";
    private static final int KEY_SIZE = 256;
    
    // In-memory storage (would be database in production)
    private final Map<String, Order> orders = new LinkedHashMap<>();
    private final Map<String, Transaction> transactions = new LinkedHashMap<>();
    private final List<String> transactionLog = new ArrayList<>();

    // ===== Models =====
    
    static class PaymentRequest {
        String method;          // "card", "paypal", "upi", "netbanking"
        String cardNumber;
        String cardHolder;
        String cardExpiry;
        String cardCvc;
        String paypalEmail;
        String upiId;
        String bankCode;
        double amount;
        String currency;
        String orderId;
        Map<String, Object> metadata;

        // Getters and setters
        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }
        public String getCardNumber() { return cardNumber; }
        public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
        public String getCurrency() { return currency != null ? currency : "INR"; }
    }

    static class PaymentResponse {
        boolean success;
        String transactionId;
        String orderId;
        String status;
        String message;
        String gateway;
        LocalDateTime timestamp;
        Map<String, Object> details;

        PaymentResponse(boolean success, String message) {
            this.success = success;
            this.message = message;
            this.timestamp = LocalDateTime.now();
            this.details = new HashMap<>();
        }
    }

    static class Order {
        String orderId;
        String status; // "pending", "confirmed", "failed", "refunded"
        double amount;
        String currency;
        List<OrderItem> items;
        ShippingInfo shipping;
        String paymentMethod;
        String transactionId;
        LocalDateTime createdAt;
        LocalDateTime updatedAt;

        Order(String orderId) {
            this.orderId = orderId;
            this.status = "pending";
            this.createdAt = LocalDateTime.now();
            this.updatedAt = LocalDateTime.now();
            this.items = new ArrayList<>();
        }
    }

    static class OrderItem {
        int productId;
        String name;
        int quantity;
        double price;
    }

    static class ShippingInfo {
        String firstName, lastName, email, phone;
        String address, city, state, pincode, country;
        String method; // "standard", "express", "overnight"
    }

    static class Transaction {
        String transactionId;
        String orderId;
        String type; // "charge", "refund", "capture"
        String status; // "authorized", "captured", "declined", "refunded"
        String gateway; // "stripe", "paypal", "upi", "netbanking"
        double amount;
        String currency;
        String cardLast4;
        String cardBrand;
        LocalDateTime createdAt;
        Map<String, String> gatewayResponse;

        Transaction(String transactionId) {
            this.transactionId = transactionId;
            this.createdAt = LocalDateTime.now();
            this.gatewayResponse = new HashMap<>();
        }
    }

    // ===== API Endpoints =====

    /**
     * POST /api/v1/payments/process
     * Main payment processing endpoint
     */
    // @PostMapping("/process")
    public PaymentResponse processPayment(PaymentRequest request) {
        log("INFO", "Received payment request: " + request.getMethod() + " | Amount: " + request.getAmount());

        // Step 1: Validate request
        String validationError = validatePaymentRequest(request);
        if (validationError != null) {
            log("ERROR", "Validation failed: " + validationError);
            return new PaymentResponse(false, validationError);
        }
        log("INFO", "Request validation passed ✓");

        // Step 2: Create order
        String orderId = generateOrderId();
        Order order = new Order(orderId);
        order.amount = request.getAmount();
        order.currency = request.getCurrency();
        order.paymentMethod = request.getMethod();
        orders.put(orderId, order);
        log("INFO", "Order created: " + orderId);

        // Step 3: Generate transaction
        String txnId = generateTransactionId();
        Transaction txn = new Transaction(txnId);
        txn.orderId = orderId;
        txn.amount = request.getAmount();
        txn.currency = request.getCurrency();
        txn.gateway = mapMethodToGateway(request.getMethod());

        // Step 4: Route to appropriate payment gateway
        PaymentResponse response;
        switch (request.getMethod().toLowerCase()) {
            case "card":
                response = processCardPayment(request, txn);
                break;
            case "paypal":
                response = processPayPalPayment(request, txn);
                break;
            case "upi":
                response = processUPIPayment(request, txn);
                break;
            case "netbanking":
                response = processNetBankingPayment(request, txn);
                break;
            default:
                response = new PaymentResponse(false, "Unsupported payment method: " + request.getMethod());
        }

        // Step 5: Update order status
        order.transactionId = txnId;
        order.status = response.success ? "confirmed" : "failed";
        order.updatedAt = LocalDateTime.now();

        // Step 6: Save transaction
        transactions.put(txnId, txn);

        // Step 7: Build response
        response.transactionId = txnId;
        response.orderId = orderId;
        response.gateway = txn.gateway;

        log(response.success ? "SUCCESS" : "ERROR",
            "Payment " + (response.success ? "completed" : "failed") +
            " | TXN: " + txnId + " | Order: " + orderId);

        return response;
    }

    /**
     * GET /api/v1/payments/orders/{orderId}
     * Get order details
     */
    // @GetMapping("/orders/{orderId}")
    public Order getOrder(String orderId) {
        return orders.get(orderId);
    }

    /**
     * GET /api/v1/payments/transactions/{txnId}
     * Get transaction details
     */
    // @GetMapping("/transactions/{txnId}")
    public Transaction getTransaction(String txnId) {
        return transactions.get(txnId);
    }

    /**
     * POST /api/v1/payments/refund/{txnId}
     * Process refund for a transaction
     */
    // @PostMapping("/refund/{txnId}")
    public PaymentResponse processRefund(String txnId) {
        Transaction originalTxn = transactions.get(txnId);
        if (originalTxn == null) {
            return new PaymentResponse(false, "Transaction not found: " + txnId);
        }
        if (!"captured".equals(originalTxn.status)) {
            return new PaymentResponse(false, "Transaction cannot be refunded. Current status: " + originalTxn.status);
        }

        // Create refund transaction
        String refundTxnId = generateTransactionId();
        Transaction refundTxn = new Transaction(refundTxnId);
        refundTxn.orderId = originalTxn.orderId;
        refundTxn.type = "refund";
        refundTxn.amount = originalTxn.amount;
        refundTxn.status = "refunded";
        refundTxn.gateway = originalTxn.gateway;
        transactions.put(refundTxnId, refundTxn);

        // Update original transaction
        originalTxn.status = "refunded";

        // Update order
        Order order = orders.get(originalTxn.orderId);
        if (order != null) {
            order.status = "refunded";
            order.updatedAt = LocalDateTime.now();
        }

        log("SUCCESS", "Refund processed: " + refundTxnId + " for original: " + txnId);

        PaymentResponse response = new PaymentResponse(true, "Refund processed successfully");
        response.transactionId = refundTxnId;
        return response;
    }

    /**
     * POST /api/v1/payments/webhook
     * Handle webhook events from payment gateways
     */
    // @PostMapping("/webhook")
    public Map<String, String> handleWebhook(Map<String, Object> payload) {
        String eventType = (String) payload.get("type");
        log("INFO", "Webhook received: " + eventType);

        Map<String, String> response = new HashMap<>();
        response.put("status", "received");
        response.put("event", eventType);

        switch (eventType) {
            case "payment_intent.succeeded":
                log("SUCCESS", "Payment confirmed via webhook");
                break;
            case "payment_intent.payment_failed":
                log("ERROR", "Payment failure reported via webhook");
                break;
            case "charge.refunded":
                log("INFO", "Refund confirmed via webhook");
                break;
            default:
                log("WARN", "Unhandled webhook event: " + eventType);
        }

        return response;
    }

    // ===== Payment Gateway Handlers =====

    private PaymentResponse processCardPayment(PaymentRequest request, Transaction txn) {
        log("INFO", "[Stripe] Processing card payment...");

        String cardNumber = request.cardNumber.replaceAll("\\s", "");
        txn.cardLast4 = cardNumber.substring(cardNumber.length() - 4);
        txn.cardBrand = detectCardBrand(cardNumber);
        txn.type = "charge";

        // Simulate Stripe test card behavior
        switch (cardNumber) {
            case "4242424242424242": // Success
            case "5555555555554444": // Mastercard success
            case "378282246310005":  // Amex success
                txn.status = "captured";
                txn.gatewayResponse.put("stripe_charge_id", "ch_" + generateRandomHex(24));
                txn.gatewayResponse.put("stripe_payment_intent", "pi_" + generateRandomHex(24));
                txn.gatewayResponse.put("receipt_url", "https://pay.stripe.com/receipts/test_" + generateRandomHex(16));
                log("SUCCESS", "[Stripe] Card authorized — Brand: " + txn.cardBrand + " | Last4: " + txn.cardLast4);
                return new PaymentResponse(true, "Payment successful");

            case "4000000000000002": // Decline
                txn.status = "declined";
                txn.gatewayResponse.put("decline_code", "card_declined");
                log("ERROR", "[Stripe] Card declined by issuer");
                return new PaymentResponse(false, "Card declined by issuer");

            case "4000000000009995": // Insufficient funds
                txn.status = "declined";
                txn.gatewayResponse.put("decline_code", "insufficient_funds");
                log("ERROR", "[Stripe] Insufficient funds");
                return new PaymentResponse(false, "Insufficient funds");

            case "4000000000000069": // Expired card
                txn.status = "declined";
                txn.gatewayResponse.put("decline_code", "expired_card");
                log("ERROR", "[Stripe] Card expired");
                return new PaymentResponse(false, "Expired card");

            case "4000000000000119": // Processing error
                txn.status = "declined";
                txn.gatewayResponse.put("decline_code", "processing_error");
                log("ERROR", "[Stripe] Processing error");
                return new PaymentResponse(false, "Processing error");

            default:
                // For any other valid-looking card, simulate success
                txn.status = "captured";
                txn.gatewayResponse.put("stripe_charge_id", "ch_" + generateRandomHex(24));
                log("SUCCESS", "[Stripe] Payment authorized for card ending " + txn.cardLast4);
                return new PaymentResponse(true, "Payment successful");
        }
    }

    private PaymentResponse processPayPalPayment(PaymentRequest request, Transaction txn) {
        log("INFO", "[PayPal] Processing sandbox payment...");

        txn.type = "charge";
        txn.gatewayResponse.put("paypal_order_id", "PAYPAL-" + generateRandomHex(13).toUpperCase());
        txn.gatewayResponse.put("payer_id", "PAYER-" + generateRandomHex(10).toUpperCase());
        txn.gatewayResponse.put("payer_email", request.paypalEmail);
        txn.status = "captured";

        log("SUCCESS", "[PayPal] Payment captured — Payer: " + request.paypalEmail);
        return new PaymentResponse(true, "PayPal payment successful");
    }

    private PaymentResponse processUPIPayment(PaymentRequest request, Transaction txn) {
        log("INFO", "[UPI] Processing UPI payment — VPA: " + request.upiId);

        txn.type = "charge";
        txn.gatewayResponse.put("upi_txn_id", "UPI" + System.currentTimeMillis());
        txn.gatewayResponse.put("vpa", request.upiId);

        if (request.upiId != null && request.upiId.startsWith("fail")) {
            txn.status = "declined";
            log("ERROR", "[UPI] Transaction failed for VPA: " + request.upiId);
            return new PaymentResponse(false, "UPI transaction failed");
        }

        txn.status = "captured";
        log("SUCCESS", "[UPI] Payment successful — VPA: " + request.upiId);
        return new PaymentResponse(true, "UPI payment successful");
    }

    private PaymentResponse processNetBankingPayment(PaymentRequest request, Transaction txn) {
        log("INFO", "[NetBanking] Processing payment — Bank: " + request.bankCode);

        txn.type = "charge";
        txn.gatewayResponse.put("bank_code", request.bankCode);
        txn.gatewayResponse.put("bank_ref_no", "BNKREF" + System.currentTimeMillis());
        txn.status = "captured";

        log("SUCCESS", "[NetBanking] Payment confirmed — Bank: " + request.bankCode);
        return new PaymentResponse(true, "Net Banking payment successful");
    }

    // ===== Utility Methods =====

    private String validatePaymentRequest(PaymentRequest request) {
        if (request.getMethod() == null || request.getMethod().isEmpty()) return "Payment method is required";
        if (request.getAmount() <= 0) return "Invalid payment amount";
        if ("card".equals(request.getMethod())) {
            if (request.cardNumber == null || request.cardNumber.replaceAll("\\s", "").length() < 13) return "Invalid card number";
            if (request.cardExpiry == null) return "Card expiry is required";
            if (request.cardCvc == null) return "CVC is required";
            if (!luhnCheck(request.cardNumber.replaceAll("\\s", ""))) return "Card number failed Luhn check";
        }
        if ("paypal".equals(request.getMethod())) {
            if (request.paypalEmail == null || !request.paypalEmail.contains("@")) return "Valid PayPal email required";
        }
        if ("upi".equals(request.getMethod())) {
            if (request.upiId == null || !request.upiId.contains("@")) return "Valid UPI ID required";
        }
        if ("netbanking".equals(request.getMethod())) {
            if (request.bankCode == null || request.bankCode.isEmpty()) return "Bank selection required";
        }
        return null;
    }

    /**
     * Luhn algorithm for card number validation
     */
    private boolean luhnCheck(String cardNumber) {
        int sum = 0;
        boolean alternate = false;
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(cardNumber.charAt(i));
            if (alternate) { digit *= 2; if (digit > 9) digit -= 9; }
            sum += digit;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }

    private String detectCardBrand(String number) {
        if (number.startsWith("4")) return "Visa";
        if (number.matches("^5[1-5].*")) return "Mastercard";
        if (number.matches("^3[47].*")) return "American Express";
        if (number.matches("^6(?:011|5).*")) return "Discover";
        return "Unknown";
    }

    private String mapMethodToGateway(String method) {
        switch (method.toLowerCase()) {
            case "card": return "stripe";
            case "paypal": return "paypal";
            case "upi": return "upi_gateway";
            case "netbanking": return "netbanking_gateway";
            default: return "unknown";
        }
    }

    private String generateOrderId() {
        return "ORD-" + Long.toString(System.currentTimeMillis(), 36).toUpperCase() + "-" +
               generateRandomHex(5).toUpperCase();
    }

    private String generateTransactionId() {
        return "TXN_" + generateRandomHex(16).toUpperCase();
    }

    private String generateRandomHex(int length) {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(Integer.toHexString(random.nextInt(16)));
        }
        return sb.toString();
    }

    private void log(String level, String message) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"));
        String logEntry = String.format("[%s] [%s] %s", timestamp, level, message);
        transactionLog.add(logEntry);
        System.out.println(logEntry);
    }

    // ===== Main Method (for demo testing) =====
    public static void main(String[] args) {
        System.out.println("╔══════════════════════════════════════════════════╗");
        System.out.println("║        NovaPay Payment Server v1.0.0            ║");
        System.out.println("║    Java Backend — Payment Processing API        ║");
        System.out.println("╚══════════════════════════════════════════════════╝");
        System.out.println();

        PaymentController controller = new PaymentController();

        // Test 1: Successful card payment
        System.out.println("=== Test 1: Successful Card Payment ===");
        PaymentRequest req1 = new PaymentRequest();
        req1.setMethod("card");
        req1.setCardNumber("4242424242424242");
        req1.cardHolder = "SARTHAK KUMAR";
        req1.cardExpiry = "12/28";
        req1.cardCvc = "123";
        req1.setAmount(12999.00);
        req1.currency = "INR";
        PaymentResponse res1 = controller.processPayment(req1);
        System.out.println("Result: " + (res1.success ? "SUCCESS" : "FAILED") + " | " + res1.message);
        System.out.println("Transaction ID: " + res1.transactionId);
        System.out.println("Order ID: " + res1.orderId);
        System.out.println();

        // Test 2: Declined card
        System.out.println("=== Test 2: Declined Card Payment ===");
        PaymentRequest req2 = new PaymentRequest();
        req2.setMethod("card");
        req2.setCardNumber("4000000000000002");
        req2.cardHolder = "TEST DECLINE";
        req2.cardExpiry = "12/28";
        req2.cardCvc = "123";
        req2.setAmount(5999.00);
        PaymentResponse res2 = controller.processPayment(req2);
        System.out.println("Result: " + (res2.success ? "SUCCESS" : "FAILED") + " | " + res2.message);
        System.out.println();

        // Test 3: PayPal payment
        System.out.println("=== Test 3: PayPal Sandbox Payment ===");
        PaymentRequest req3 = new PaymentRequest();
        req3.setMethod("paypal");
        req3.paypalEmail = "sb-buyer@personal.example.com";
        req3.setAmount(24999.00);
        PaymentResponse res3 = controller.processPayment(req3);
        System.out.println("Result: " + (res3.success ? "SUCCESS" : "FAILED") + " | " + res3.message);
        System.out.println();

        // Test 4: UPI payment
        System.out.println("=== Test 4: UPI Payment ===");
        PaymentRequest req4 = new PaymentRequest();
        req4.setMethod("upi");
        req4.upiId = "test@upi";
        req4.setAmount(7999.00);
        PaymentResponse res4 = controller.processPayment(req4);
        System.out.println("Result: " + (res4.success ? "SUCCESS" : "FAILED") + " | " + res4.message);
        System.out.println();

        // Test 5: Refund
        if (res1.transactionId != null) {
            System.out.println("=== Test 5: Refund Processing ===");
            PaymentResponse refundRes = controller.processRefund(res1.transactionId);
            System.out.println("Refund Result: " + (refundRes.success ? "SUCCESS" : "FAILED") + " | " + refundRes.message);
            System.out.println();
        }

        System.out.println("=== All Tests Complete ===");
        System.out.println("Total Orders: " + controller.orders.size());
        System.out.println("Total Transactions: " + controller.transactions.size());
    }
}
