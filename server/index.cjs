require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer'); 
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const { FedaPay, Transaction } = require('fedapay');

const app = express();

// --- CONFIGURATION DE LA CLÉ API PI (MISE À JOUR) ---
// Remplace "TA_CLE_API_SECRET_ICI" par ta vraie clé si Railway ne la détecte toujours pas
const PI_KEY = process.env.PI_API_KEY || "qn5jxbrlsx0l5h0ueoopyqygeuyausotdpwiwmuiftbenuyl4f5guocpgxaqlojw";

console.log("-------------------------------------------");
console.log("🔍 DIAGNOSTIC DKS - BUNIA");
console.log("PORT:", process.env.PORT || 8080);
console.log("PI_API_KEY STATUS:", PI_KEY !== "TA_CLE_API_SECRET_ICI" ? "✅ CHARGÉE" : "⚠️ UTILISATION DU CODE EN DUR");
console.log("-------------------------------------------");

// --- CONFIGURATION FEDAPAY ---
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_MODE || 'sandbox');

// --- MIDDLEWARES ---
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// --- INITIALISATION DE LA BASE DE DONNÉES ---
let db;
async function initDb() {
    db = await open({
        filename: path.join(__dirname, 'dks_database.db'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, price REAL, stock INTEGER,
            category TEXT, description TEXT, image TEXT, createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY, txid TEXT, customerName TEXT,
            total REAL, items TEXT, status TEXT, paymentMethod TEXT, createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, role TEXT, pin TEXT, location TEXT
        );
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT, amount REAL, category TEXT, date TEXT
        );
    `);

    const userCheck = await db.get('SELECT count(*) as count FROM users');
    if (userCheck.count === 0) {
        await db.run("INSERT INTO users (name, role, pin, location) VALUES ('Admin Double King', 'administrator', '0000', 'Bunia')");
        await db.run("INSERT INTO users (name, role, pin, location) VALUES ('Vendeur DKS', 'vendeur', '1111', 'Bunia')");
    }
    console.log("🗄️ BASE DE DONNÉES DKS CONNECTÉE");
}
initDb().catch(err => console.error("❌ Erreur DB:", err));

// --- ROUTES API ---

app.post('/api/auth/login', async (req, res) => {
    try {
        const { pin } = req.body;
        const user = await db.get('SELECT * FROM users WHERE pin = ?', [pin]);
        if (user) {
            res.json({ success: true, user: { name: user.name, role: user.role, location: user.location } });
        } else {
            res.status(401).json({ success: false, message: "PIN incorrect" });
        }
    } catch (error) { res.status(500).json({ error: "Erreur serveur" }); }
});

// 1. PI NETWORK : APPROBATION
app.post('/api/pi/approve', async (req, res) => {
    try {
        const { paymentId } = req.body;
        console.log(`[PI] Approbation en cours pour : ${paymentId}`);

        await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`,
            {},
            { headers: { 'Authorization': `Key ${PI_KEY}`, 'Content-Type': 'application/json' } }
        );

        console.log(`✅ Paiement ${paymentId} approuvé`);
        res.json({ success: true, approved: true });
    } catch (error) {
        console.error("❌ Erreur Pi Approve:", error.response?.data || error.message);
        res.status(500).json({ error: "Échec de l'approbation Pi" });
    }
});

// 2. PI NETWORK : FINALISATION
app.post('/api/orders/pi', async (req, res) => {
    try {
        const { paymentId, txid, amount, items } = req.body;

        await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`,
            { txid },
            { headers: { 'Authorization': `Key ${PI_KEY}`, 'Content-Type': 'application/json' } }
        );

        await db.run('BEGIN TRANSACTION');
        for (const item of items) {
            await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
        }
        await db.run(
            `INSERT INTO orders (id, txid, total, items, status, paymentMethod, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [paymentId, txid, amount, JSON.stringify(items), 'completed', 'pi_network', new Date().toISOString()]
        );
        await db.run('COMMIT');

        res.status(201).json({ success: true });
    } catch (error) {
        if (db) await db.run('ROLLBACK');
        console.error("❌ Erreur Pi Complete:", error.response?.data || error.message);
        res.status(500).json({ error: "Erreur lors de la validation finale" });
    }
});

// 3. FEDAPAY : MOBILE MONEY
app.post('/api/mobile-money/initiate', async (req, res) => {
    try {
        const { phoneNumber, provider, amountUSD } = req.body;
        const transaction = await Transaction.create({
            description: `Achat DKS - ${provider}`,
            amount: Math.round(amountUSD),
            currency: { iso: 'USD' },
            customer: {
                firstname: 'Client',
                lastname: 'DKS',
                phone_number: { number: phoneNumber, country: 'CD' }
            }
        });
        const token = await transaction.generateToken();
        res.json({ success: true, url: token.url });
    } catch (error) { res.status(500).json({ error: "Erreur FedaPay" }); }
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await db.all('SELECT * FROM products ORDER BY id DESC');
        res.json(products);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- SERVIR LE FRONTEND ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) return res.status(404).json({ error: "API 404" });
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVEUR DKS PRÊT SUR PORT ${PORT}`);
});
