require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer'); 
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
// IMPORTATION FEDAPAY
const { FedaPay, Transaction } = require('fedapay');

const app = express();

// --- CONFIGURATION FEDAPAY ---
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_MODE || 'sandbox');

// --- CONFIGURATION MIDDLEWARES ---
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Création du dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
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
        CREATE TABLE IF NOT EXISTS taxes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, rate REAL, type TEXT
        );
    `);

    const userCheck = await db.get('SELECT count(*) as count FROM users');
    if (userCheck.count === 0) {
        await db.run("INSERT INTO users (name, role, pin, location) VALUES ('Admin Double King', 'administrator', '0000', 'Bunia')");
        await db.run("INSERT INTO users (name, role, pin, location) VALUES ('Vendeur DKS', 'vendeur', '1111', 'Bunia')");
        await db.run("INSERT INTO users (name, role, pin, location) VALUES ('Caissier DKS', 'caissier', '2222', 'Bunia')");
    }
    console.log("-------------------------------------------");
    console.log("🗄️ BASE DE DONNÉES DKS CONNECTÉE (SQLITE)");
    console.log("-------------------------------------------");
}

initDb().catch(err => console.error("❌ Erreur DB:", err));

// --- ROUTES API ---

// 0. AUTHENTIFICATION (LOGIN) - Correction de l'erreur 404
app.post('/api/auth/login', async (req, res) => {
    try {
        const { pin } = req.body;
        const user = await db.get('SELECT * FROM users WHERE pin = ?', [pin]);

        if (user) {
            console.log(`✅ Connexion réussie : ${user.name}`);
            res.json({ 
                success: true, 
                user: { name: user.name, role: user.role, location: user.location } 
            });
        } else {
            res.status(401).json({ success: false, message: "PIN incorrect" });
        }
    } catch (error) {
        res.status(500).json({ error: "Erreur de connexion" });
    }
});

// 1. PI NETWORK : APPROBATION
app.post('/api/pi/approve', async (req, res) => {
    try {
        const { paymentId } = req.body;
        console.log(`[PI] Approbation : ${paymentId}`);
        res.json({ success: true, approved: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. PI NETWORK : FINALISATION
app.post('/api/orders/pi', async (req, res) => {
    try {
        const { paymentId, txid, amount, items } = req.body;
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
        await db.run('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// 3. FEDAPAY : INITIATION
app.post('/api/mobile-money/initiate', async (req, res) => {
    try {
        const { phoneNumber, provider, amountUSD } = req.body;
        const transaction = await Transaction.create({
            description: `Achat DKS - ${provider}`,
            amount: Math.round(amountUSD), // FedaPay préfère les entiers
            currency: { iso: 'USD' },
            customer: {
                firstname: 'Client',
                lastname: 'DKS',
                phone_number: { number: phoneNumber, country: 'CD' }
            }
        });
        const token = await transaction.generateToken();
        res.json({ success: true, url: token.url, transactionId: transaction.id });
    } catch (error) {
        res.status(500).json({ error: "Erreur FedaPay" });
    }
});

// 4. HISTORIQUE & PRODUITS
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
        res.json(orders || []);
    } catch (error) { res.status(500).json({ error: "Erreur orders" }); }
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

// --- DÉMARRAGE ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVEUR DKS PRÊT SUR PORT ${PORT}`);
});
