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
// Ces clés doivent être dans l'onglet "Variables" sur Railway
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_MODE || 'sandbox');

// --- CONFIGURATION MIDDLEWARES ---
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

app.use('/api', (req, res, next) => {
    if (!db) return res.status(503).json({ error: "Base de données en cours de chargement..." });
    next();
});

// --- CONFIGURATION MULTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- ROUTES API ---

// Auth
app.post('/api/auth/login', async (req, res) => {
    const { pin } = req.body;
    try {
        const staffMember = await db.get('SELECT * FROM users WHERE pin = ?', [pin]);
        if (staffMember) {
            res.json({ success: true, user: { name: staffMember.name, role: staffMember.role, location: staffMember.location } });
        } else {
            res.status(401).json({ success: false, error: 'Code PIN incorrect' });
        }
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Produits
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.all('SELECT * FROM products ORDER BY id DESC');
        res.json(products);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
//    NOUVELLES ROUTES : PAIEMENTS RÉELS
// ==========================================

// 1. INITIATION RÉELLE VIA FEDAPAY (Remplace la simulation)
app.post('/api/mobile-money/initiate', async (req, res) => {
    try {
        const { phoneNumber, provider, amountUSD } = req.body;
        
        // Création de la transaction chez FedaPay
        const transaction = await Transaction.create({
            description: `Achat DKS - ${provider}`,
            amount: amountUSD,
            currency: { iso: 'USD' },
            customer: {
                firstname: 'Client',
                lastname: 'DKS',
                phone_number: {
                    number: phoneNumber,
                    country: 'CD' // Congo-Kinshasa
                }
            }
        });

        const token = await transaction.generateToken();
        
        console.log(`[FEDAPAY] Lien généré pour ${phoneNumber}: ${token.url}`);
        
        // On renvoie l'URL de paiement au Pixel 8 du client
        res.json({ 
            success: true, 
            url: token.url, 
            transactionId: transaction.id 
        });
    } catch (error) {
        console.error("Erreur FedaPay:", error.message);
        res.status(500).json({ error: "Impossible d'initier le paiement réel." });
    }
});

// 2. CONFIRMATION ET MISE À JOUR DU STOCK DKS
app.post('/api/mobile-money/confirm', async (req, res) => {
    try {
        const { transactionId, cartItems, totalAmount, provider } = req.body;

        await db.run('BEGIN TRANSACTION');

        for (const item of cartItems) {
            await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
        }

        await db.run(
            `INSERT INTO orders (id, total, items, status, paymentMethod, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [transactionId, totalAmount, JSON.stringify(cartItems), 'completed', `mobile_money_${provider}`, new Date().toISOString()]
        );

        await db.run('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// 3. HISTORIQUE DES COMMANDES (Dashboard)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
        res.json(orders || []);
    } catch (error) {
        res.status(500).json({ error: "Erreur de chargement des commandes" });
    }
});

// --- SERVIR LE FRONTEND ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) return res.status(404).json({ error: "Route API non trouvée" });
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) res.status(500).send("Erreur Frontend absent.");
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVEUR DKS OPÉRATIONNEL SUR PORT ${PORT}`);
});
