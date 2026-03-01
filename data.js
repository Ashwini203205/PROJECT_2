// ===== NovaPay Product Data =====
const PRODUCTS = [
    { id: 1, name: "Premium Wireless Headphones", category: "Audio", price: 12999, originalPrice: 18999, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop", description: "Immersive sound with active noise cancellation and 40hr battery life", badge: "Best Seller", rating: 4.8 },
    { id: 2, name: "Smart Watch Pro X", category: "Wearables", price: 24999, originalPrice: 34999, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop", description: "Advanced fitness tracking with AMOLED display and GPS navigation", badge: "New", rating: 4.7 },
    { id: 3, name: "Ultra-Thin Laptop 15\"", category: "Computers", price: 74999, originalPrice: 89999, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop", description: "Intel i9 processor, 32GB RAM, 1TB SSD with stunning 4K display", badge: "Hot", rating: 4.9 },
    { id: 4, name: "Wireless Earbuds ANC", category: "Audio", price: 7999, originalPrice: 12999, image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=300&fit=crop", description: "True wireless with active noise cancellation and premium sound quality", badge: "", rating: 4.6 },
    { id: 5, name: "Gaming Mouse RGB", category: "Accessories", price: 4999, originalPrice: 6999, image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop", description: "16000 DPI sensor with programmable buttons and RGB lighting effects", badge: "Sale", rating: 4.5 },
    { id: 6, name: "Mechanical Keyboard 75%", category: "Accessories", price: 8999, originalPrice: 12999, image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=300&fit=crop", description: "Hot-swappable switches, RGB backlight, aluminum frame build", badge: "", rating: 4.7 },
    { id: 7, name: "Portable Bluetooth Speaker", category: "Audio", price: 5999, originalPrice: 8999, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop", description: "360° surround sound with 20hr battery and waterproof design", badge: "", rating: 4.4 },
    { id: 8, name: "Pro Tablet 12.9\"", category: "Computers", price: 49999, originalPrice: 64999, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop", description: "M2 chip, Liquid Retina XDR display with Apple Pencil support", badge: "Premium", rating: 4.9 },
    { id: 9, name: "4K Webcam Ultra HD", category: "Accessories", price: 9999, originalPrice: 14999, image: "https://images.unsplash.com/photo-1587826080692-f439cd0b70e0?w=400&h=300&fit=crop", description: "Ultra-sharp 4K video with autofocus and built-in ring light", badge: "", rating: 4.3 },
    { id: 10, name: "Wireless Charging Pad", category: "Accessories", price: 2999, originalPrice: 4999, image: "https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=400&h=300&fit=crop", description: "15W fast wireless charging with LED indicator and anti-slip surface", badge: "Deal", rating: 4.2 },
    { id: 11, name: "Smart Home Hub", category: "Smart Home", price: 14999, originalPrice: 19999, image: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400&h=300&fit=crop", description: "Voice-controlled home automation with Alexa and Google Assistant", badge: "", rating: 4.5 },
    { id: 12, name: "Drone Camera 4K", category: "Cameras", price: 59999, originalPrice: 79999, image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop", description: "Professional aerial photography drone with 4K camera and 30min flight time", badge: "Pro", rating: 4.8 },
];

// Stripe test card numbers
const STRIPE_TEST_CARDS = {
    success: { number: "4242424242424242", brand: "Visa", status: "Success" },
    decline: { number: "4000000000000002", brand: "Visa", status: "Declined" },
    insufficient: { number: "4000000000009995", brand: "Visa", status: "Insufficient Funds" },
    expired: { number: "4000000000000069", brand: "Visa", status: "Expired Card" },
    processing_error: { number: "4000000000000119", brand: "Visa", status: "Processing Error" },
    mastercard: { number: "5555555555554444", brand: "Mastercard", status: "Success" },
    amex: { number: "378282246310005", brand: "Amex", status: "Success" },
};

// PayPal sandbox credentials
const PAYPAL_SANDBOX = {
    clientId: "sb-XXXXX123456@business.example.com",
    secret: "sandbox_secret_key_demo_000",
    buyerEmail: "sb-buyer@personal.example.com",
    buyerPassword: "sandbox_demo",
    sellerEmail: "sb-seller@business.example.com"
};

// Bank list for net banking
const BANKS = [
    { code: "SBI", name: "State Bank of India", icon: "🏛️" },
    { code: "HDFC", name: "HDFC Bank", icon: "🏦" },
    { code: "ICICI", name: "ICICI Bank", icon: "🏦" },
    { code: "AXIS", name: "Axis Bank", icon: "🏦" },
    { code: "PNB", name: "Punjab National Bank", icon: "🏛️" },
    { code: "BOB", name: "Bank of Baroda", icon: "🏛️" },
    { code: "KOTAK", name: "Kotak Mahindra Bank", icon: "🏦" },
    { code: "YES", name: "Yes Bank", icon: "🏦" },
];

// Currency formatter
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

// Generate unique transaction ID
function generateTransactionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TXN_';
    for (let i = 0; i < 16; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

// Generate unique order ID
function generateOrderId() {
    return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}
