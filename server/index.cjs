require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer'); 
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');

const app = express();

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

// Validation Pi Network
app.get('/validation-key.txt', (req, res) => {
    const rootPath = path.resolve(__dirname, '..', 'validation-key.txt');
    if (fs.existsSync(rootPath)) {
        return res.sendFile(rootPath);
    } else {
        res.status(404).send("Erreur : Fichier absent.");
    }
});

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

app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, price, stock, category, description } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : '/uploads/default.jpg';
        const result = await db.run(
            `INSERT INTO products (name, price, stock, category, description, image, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, parseFloat(price), parseInt(stock), category, description, imagePath, new Date().toISOString()]
        );
        res.status(201).json({ id: result.lastID, name, image: imagePath });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
//    NOUVELLES ROUTES : PAIEMENTS & VENTES
// ==========================================

// 1. PI NETWORK : APPROBATION
app.post('/api/pi/approve', (req, res) => {
    const { paymentId } = req.body;
    console.log(`Paiement Pi initié : ${paymentId}`);
    res.json({ success: true });
});

// 2. PI NETWORK : ENREGISTREMENT & STOCK
app.post('/api/orders/pi', async (req, res) => {
    try {
        const { paymentId, txid, amount, items } = req.body;
        
        await db.run('BEGIN TRANSACTION');
        
        // Mise à jour des stocks pour chaque produit
        for (const item of items) {
            await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
        }

        // Enregistrement de la vente
        await db.run(
            `INSERT INTO orders (id, txid, total, items, status, paymentMethod, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [paymentId, txid, amount, JSON.stringify(items), 'completed', 'pi_network', new Date().toISOString()]
        );

        await db.run('COMMIT');
        console.log(`✅ Vente Pi réussie : ${paymentId}`);
        res.status(201).json({ success: true });
    } catch (error) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// 3. MOBILE MONEY : INITIATION
app.post('/api/mobile-money/initiate', async (req, res) => {
    try {
        const { phoneNumber, provider, amountUSD } = req.body;
        const transactionId = `MM-DKS-${Date.now()}`;
        // Simulation initiation opérateur
        res.json({ success: true, transactionId });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. MOBILE MONEY : CONFIRMATION & STOCK
app.post('/api/mobile-money/confirm', async (req, res) => {
    try {
        const { transactionId, cartItems, totalAmount } = req.body;

        await db.run('BEGIN TRANSACTION');
        
        for (const item of cartItems) {
            await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
        }

        await db.run(
            `INSERT INTO orders (id, total, items, status, paymentMethod, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [transactionId, totalAmount, JSON.stringify(cartItems), 'completed', 'mobile_money', new Date().toISOString()]
        );

        await db.run('COMMIT');
        console.log(`✅ Vente Mobile Money réussie : ${transactionId}`);
        res.json({ success: true });
    } catch (error) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// 5. HISTORIQUE DES COMMANDES
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
        res.json(orders);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- AUTRES ---
app.get('/api/expenses', async (req, res) => {
    const expenses = await db.all('SELECT * FROM expenses ORDER BY date DESC');
    res.json(expenses);
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
