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

const PI_KEY = process.env.PI_API_KEY || "qn5jxbrlsx0l5h0ueoopyqygeuyausotdpwiwmuiftbenuyl4f5guocpgxaqlojw";

// --- CONFIGURATION FEDAPAY ---
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_MODE || 'sandbox');

// --- MIDDLEWARES ---
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
});
const upload = multer({ storage: storage });

// --- INITIALISATION DE LA BASE DE DONNÉES ---
let db;
async function initDb() {
    db = await open({
        filename: path.join(__dirname, 'dks_database.db'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            description TEXT
        );
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, price REAL, stock INTEGER,
            category TEXT, description TEXT, image TEXT, createdAt TEXT,
            published INTEGER DEFAULT 0
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

    const tableInfo = await db.all("PRAGMA table_info(products)");
    const hasPublished = tableInfo.some(column => column.name === 'published');
    if (!hasPublished) {
        await db.exec("ALTER TABLE products ADD COLUMN published INTEGER DEFAULT 0");
        console.log("✅ Colonne 'published' ajoutée à la table products");
    }

    const userCheck = await db.get('SELECT count(*) as count FROM users');
    if (userCheck.count === 0) {
        await db.run("INSERT INTO users (name, role, pin, location) VALUES ('Admin Double King', 'administrator', '0000', 'Bunia')");
    }
    console.log("🗄️ BASE DE DONNÉES DKS PRÊTE");
}
initDb().catch(err => console.error("❌ Erreur DB:", err));

// --- ROUTES PRODUITS ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.all('SELECT * FROM products ORDER BY id DESC');
        res.json(products);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/products/:id/publish', async (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;
        await db.run('UPDATE products SET published = ? WHERE id = ?', [published, id]);
        res.json({ success: true, published: !!published });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, price, stock, category, description } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        await db.run(
            `INSERT INTO products (name, price, stock, category, description, image, createdAt, published) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, price, stock, category, description, imagePath, new Date().toISOString(), 0]
        );
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, price, stock, category, description } = req.body;
        const prod = await db.get('SELECT image FROM products WHERE id = ?', [req.params.id]);
        const imagePath = req.file ? `/uploads/${req.file.filename}` : prod.image;
        await db.run(
            `UPDATE products SET name=?, price=?, stock=?, category=?, description=?, image=? WHERE id=?`,
            [name, price, stock, category, description, imagePath, req.params.id]
        );
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- ROUTES CATÉGORIES ---
app.get('/api/categories', async (req, res) => {
    try {
        const cats = await db.all('SELECT * FROM categories ORDER BY name ASC');
        res.json(cats);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/categories', async (req, res) => {
    const { name, description } = req.body;
    try {
        await db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
        res.json({ success: true });
    } catch (e) { res.status(400).json({ error: "Cette catégorie existe déjà." }); }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ROUTES DÉPENSES ---
app.get('/api/expenses', async (req, res) => {
    const list = await db.all('SELECT * FROM expenses ORDER BY date DESC');
    res.json(list);
});

app.post('/api/expenses', async (req, res) => {
    const { description, amount, category, date } = req.body;
    await db.run('INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)', 
        [description, amount, category, date]);
    res.json({ success: true });
});

app.delete('/api/expenses/:id', async (req, res) => {
    await db.run('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

// --- ROUTES UTILISATEURS ---
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.all('SELECT id, name, role, pin, location FROM users');
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
    const { name, role, pin, location } = req.body;
    try {
        await db.run(
            'INSERT INTO users (name, role, pin, location) VALUES (?, ?, ?, ?)',
            [name, role, pin, location || 'Bunia']
        );
        res.json({ success: true });
    } catch (e) { res.status(400).json({ error: "Erreur lors de la création de l'utilisateur." }); }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const adminCount = await db.get("SELECT count(*) as count FROM users WHERE role = 'administrator'");
        const userToDelete = await db.get("SELECT role FROM users WHERE id = ?", [req.params.id]);
        if (userToDelete.role === 'administrator' && adminCount.count <= 1) {
            return res.status(400).json({ error: "Impossible de supprimer le dernier administrateur." });
        }
        await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ROUTES AUTH ---
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

// --- ROUTES PI & FEDAPAY ---
app.post('/api/pi/approve', async (req, res) => {
    try {
        const { paymentId } = req.body;
        await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {}, { headers: { 'Authorization': `Key ${PI_KEY}`, 'Content-Type': 'application/json' } });
        res.json({ success: true, approved: true });
    } catch (error) { res.status(500).json({ error: "Erreur Pi" }); }
});

app.post('/api/orders/pi', async (req, res) => {
    try {
        const { paymentId, txid, amount, items } = req.body;
        await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/complete`, { txid }, { headers: { 'Authorization': `Key ${PI_KEY}`, 'Content-Type': 'application/json' } });
        await db.run('BEGIN TRANSACTION');
        for (const item of items) { await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]); }
        await db.run(`INSERT INTO orders (id, txid, total, items, status, paymentMethod, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`, [paymentId, txid, amount, JSON.stringify(items), 'completed', 'pi_network', new Date().toISOString()]);
        await db.run('COMMIT');
        res.status(201).json({ success: true });
    } catch (error) { if (db) await db.run('ROLLBACK'); res.status(500).json({ error: "Erreur Pi Complete" }); }
});

app.post('/api/mobile-money/initiate', async (req, res) => {
    try {
        const { phoneNumber, provider, amountUSD } = req.body;
        const transaction = await Transaction.create({
            description: `Achat DKS - ${provider}`,
            amount: Math.round(amountUSD),
            currency: { iso: 'USD' },
            customer: { firstname: 'Client', lastname: 'DKS', phone_number: { number: phoneNumber, country: 'CD' } }
        });
        const token = await transaction.generateToken();
        res.json({ success: true, url: token.url });
    } catch (error) { res.status(500).json({ error: "Erreur FedaPay" }); }
});

app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
        res.json(orders);
    } catch (e) { res.status(500).json({ error: "Erreur orders" }); }
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) return res.status(404).json({ error: "API 404" });
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 DKS BUNIA PRÊT SUR PORT ${PORT}`));
