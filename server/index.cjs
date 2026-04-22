// server/index.cjs
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
const PORT = process.env.PORT || 8080;
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

// --- UPLOAD CONFIG ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname.replace(/\s+/g, '_').toLowerCase();
        cb(null, uniqueName);
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Format d\'image invalide'));
    }
});

// --- DATABASE INIT ---
let db;
async function initDb() {
    db = await open({
        filename: path.join(__dirname, 'dks_database.db'),
        driver: sqlite3.Database
    });

    // Création des tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0,
            category TEXT,
            description TEXT,
            image TEXT,
            published INTEGER DEFAULT 0,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            txid TEXT,
            customerName TEXT,
            total REAL,
            items TEXT,
            status TEXT DEFAULT 'pending',
            paymentMethod TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'vendeur',
            pin TEXT NOT NULL,
            location TEXT DEFAULT 'Bunia',
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,            
            description TEXT,
            amount REAL,
            category TEXT,
            date TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS taxes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            rate REAL NOT NULL,
            type TEXT DEFAULT 'percentage',
            active INTEGER DEFAULT 1,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Migration : ajouter published si n'existe pas
    const tableInfo = await db.all("PRAGMA table_info(products)");
    const hasPublished = tableInfo.some(col => col.name === 'published');
    if (!hasPublished) {
        await db.exec("ALTER TABLE products ADD COLUMN published INTEGER DEFAULT 1");
        console.log("✅ Migration 'published' appliquée");
    }

    // Créer un admin par défaut si aucun utilisateur
    const userCount = await db.get('SELECT count(*) as count FROM users');
    if (userCount.count === 0) {
        await db.run("INSERT INTO users (name, role, pin, location) VALUES ('Admin DKS', 'administrator', '0000', 'Bunia')");
        console.log("👤 Admin par défaut créé (PIN: 0000)");
    }

    console.log("🗄️ Base de données DKS prête");
}
// 🚨 ON NE LANCE PLUS initDb() ICI ! 
// C'est la fonction startServer() en bas du fichier qui s'en chargera.

// ==================== MIDDLEWARE D'AUTHENTIFICATION ====================

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const pin = authHeader?.replace('Bearer ', '');
        
        if (!pin) {
            return res.status(401).json({ error: 'PIN requis' });
        }
        
        const user = await db.get('SELECT * FROM users WHERE pin = ?', [pin]);
        if (!user) {
            return res.status(401).json({ error: 'PIN incorrect' });        }
        
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        res.status(500).json({ error: 'Erreur d\'authentification' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'administrator') {
        return res.status(403).json({ error: 'Accès administrateur requis' });
    }
    next();
};

// ==================== ROUTES PUBLIQUES ====================

// 📦 Produits - Lecture publique (filtrage published)
app.get('/api/products', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const pin = authHeader?.replace('Bearer ', '');
        const user = pin ? await db.get('SELECT role FROM users WHERE pin = ?', [pin]) : null;
        
        const whereClause = user?.role === 'administrator' ? '' : 'WHERE published = 1';
        const products = await db.all(`SELECT * FROM products ${whereClause} ORDER BY createdAt DESC`);
        
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 📦 Produit par ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
        
        const authHeader = req.headers['authorization'];
        const pin = authHeader?.replace('Bearer ', '');
        const user = pin ? await db.get('SELECT role FROM users WHERE pin = ?', [pin]) : null;
        
        if (user?.role !== 'administrator' && !product.published) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }
                res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 🗂️ Catégories - Lecture publique
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await db.all('SELECT * FROM categories ORDER BY name ASC');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 🛒 Commandes - Lecture publique
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC LIMIT 50');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==================== ROUTES PROTÉGÉES (Auth + Admin) ====================

// ➕ Créer un produit (Admin)
app.post('/api/products', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, price, stock, category, description, published } = req.body;
        
        if (!name?.trim() || !price || !category) {
            return res.status(400).json({ error: 'Nom, prix et catégorie sont requis' });
        }
        
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        const publishedInt = published === 'true' || published === true ? 1 : 0;
        
        const result = await db.run(
            `INSERT INTO products (name, price, stock, category, description, image, published, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name.trim(), parseFloat(price), parseInt(stock) || 0, category.trim(), description?.trim() || '', imagePath, publishedInt, new Date().toISOString()]
        );
        
        const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [result.lastID]);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);        res.status(500).json({ error: error.message });
    }
});

// ✏️ Modifier un produit (Admin)
app.put('/api/products/:id', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, stock, category, description, published } = req.body;
        
        const current = await db.get('SELECT image FROM products WHERE id = ?', [id]);
        if (!current) return res.status(404).json({ error: 'Produit non trouvé' });
        
        const imagePath = req.file ? `/uploads/${req.file.filename}` : current.image;
        const publishedInt = published !== undefined ? (published === 'true' || published === true ? 1 : 0) : undefined;
        
        const updates = [];
        const values = [];
        
        if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
        if (price !== undefined) { updates.push('price = ?'); values.push(parseFloat(price)); }
        if (stock !== undefined) { updates.push('stock = ?'); values.push(parseInt(stock)); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category.trim()); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description?.trim() || ''); }
        if (imagePath !== undefined) { updates.push('image = ?'); values.push(imagePath); }
        if (publishedInt !== undefined) { updates.push('published = ?'); values.push(publishedInt); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
        }
        
        values.push(id);
        await db.run(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
        
        const updated = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        res.json(updated);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: error.message });
    }
});

// 👁️ Publier/Dépublier un produit (Admin)
app.patch('/api/products/:id/publish', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;
        
        if (published === undefined) {
            return res.status(400).json({ error: 'Champ "published" requis' });        }
        
        const publishedInt = published === true || published === 'true' ? 1 : 0;
        await db.run('UPDATE products SET published = ? WHERE id = ?', [publishedInt, id]);
        
        const updated = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        res.json({ success: true, product: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🗑️ Supprimer un produit (Admin)
app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const product = await db.get('SELECT image FROM products WHERE id = ?', [req.params.id]);
        if (product?.image?.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, product.image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        
        await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🗂️ Catégories - CRUD (Admin)
app.post('/api/categories', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'Nom requis' });
        
        await db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [name.trim(), description?.trim() || '']);
        const newCat = await db.get('SELECT * FROM categories WHERE name = ?', [name.trim()]);
        res.status(201).json(newCat);
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Cette catégorie existe déjà' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/categories/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        await db.run('UPDATE categories SET name = ?, description = ? WHERE id = ?', 
            [name?.trim(), description?.trim() || '', req.params.id]);        const updated = await db.get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        res.json(updated);
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Cette catégorie existe déjà' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/categories/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const count = await db.get('SELECT COUNT(*) as count FROM products WHERE category = (SELECT name FROM categories WHERE id = ?)', [req.params.id]);
        if (count.count > 0) {
            return res.status(400).json({ error: 'Impossible : des produits utilisent cette catégorie' });
        }
        await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 👥 Utilisateurs - CRUD (Admin)
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await db.all('SELECT id, name, role, pin, location, createdAt FROM users ORDER BY name');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, role, pin, location } = req.body;
        if (!name || !pin || !role) return res.status(400).json({ error: 'Nom, PIN et rôle requis' });
        
        await db.run('INSERT INTO users (name, role, pin, location) VALUES (?, ?, ?, ?)', 
            [name, role, pin, location || 'Bunia']);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✏️ MODIFIER un utilisateur (Admin) - NOUVEAU
app.put('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;        const { name, role, pin, location } = req.body;
        
        if (!name?.trim() && !role && !pin && !location) {
            return res.status(400).json({ error: 'Au moins un champ à mettre à jour est requis' });
        }
        
        if (pin) {
            const existing = await db.get('SELECT id FROM users WHERE pin = ? AND id != ?', [pin, id]);
            if (existing) {
                return res.status(409).json({ error: 'Ce PIN est déjà utilisé par un autre utilisateur' });
            }
        }
        
        const updates = [];
        const values = [];
        
        if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
        if (role !== undefined) { updates.push('role = ?'); values.push(role); }
        if (pin !== undefined) { updates.push('pin = ?'); values.push(pin); }
        if (location !== undefined) { updates.push('location = ?'); values.push(location || 'Bunia'); }
        
        values.push(id);
        
        await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        
        const updated = await db.get('SELECT id, name, role, location, createdAt FROM users WHERE id = ?', [id]);
        res.json({ success: true, user: updated });
    } catch (error) {
        console.error('Erreur modification utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

app.delete('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const user = await db.get('SELECT role FROM users WHERE id = ?', [req.params.id]);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        
        if (user.role === 'administrator') {
            const adminCount = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'administrator'");
            if (adminCount.count <= 1) {
                return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
            }
        }
        
        await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }});

// 💸 Dépenses - CRUD (Auth)
app.get('/api/expenses', requireAuth, async (req, res) => {
    try {
        const expenses = await db.all('SELECT * FROM expenses ORDER BY date DESC');
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/expenses', requireAuth, async (req, res) => {
    try {
        const { description, amount, category, date } = req.body;
        await db.run('INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)', 
            [description, amount, category, date || new Date().toISOString()]);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✏️ MODIFIER une dépense (Auth) - NOUVEAU
app.put('/api/expenses/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, category, date } = req.body;
        
        if (!description && amount === undefined && !category && !date) {
            return res.status(400).json({ error: 'Au moins un champ à mettre à jour est requis' });
        }
        
        const updates = [];
        const values = [];
        
        if (description !== undefined) { updates.push('description = ?'); values.push(description.trim()); }
        if (amount !== undefined) { updates.push('amount = ?'); values.push(parseFloat(amount)); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category.trim()); }
        if (date !== undefined) { updates.push('date = ?'); values.push(date); }
        
        values.push(id);
        
        await db.run(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`, values);
        
        const updated = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
        res.json({ success: true, expense: updated });
    } catch (error) {
        console.error('Erreur modification dépense:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });    }
});

app.delete('/api/expenses/:id', requireAuth, async (req, res) => {
    try {
        await db.run('DELETE FROM expenses WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 💰 Taxes - CRUD (Admin) - NOUVEAU
app.get('/api/taxes', requireAuth, async (req, res) => {
    try {
        const taxes = await db.all('SELECT * FROM taxes ORDER BY name');
        res.json(taxes);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

app.post('/api/taxes', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, rate, type, active } = req.body;
        
        if (!name?.trim() || rate === undefined) {
            return res.status(400).json({ error: 'Nom et taux sont requis' });
        }
        
        const result = await db.run(
            'INSERT INTO taxes (name, rate, type, active) VALUES (?, ?, ?, ?)',
            [name.trim(), rate, type || 'percentage', active !== false ? 1 : 0]
        );
        const newTax = await db.get('SELECT * FROM taxes WHERE id = ?', [result.lastID]);
        res.status(201).json(newTax);
    } catch (error) {
        if (error.message?.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Cette taxe existe déjà' });
        }
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

app.put('/api/taxes/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, rate, type, active } = req.body;
        
        const updates = [];
        const values = [];
        
        if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
        if (rate !== undefined) { updates.push('rate = ?'); values.push(rate); }
        if (type !== undefined) { updates.push('type = ?'); values.push(type); }
        if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
        }
        
        values.push(id);
        await db.run(`UPDATE taxes SET ${updates.join(', ')} WHERE id = ?`, values);
        
        const updated = await db.get('SELECT * FROM taxes WHERE id = ?', [id]);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

app.delete('/api/taxes/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        await db.run('DELETE FROM taxes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// 🔐 Authentification
app.post('/api/auth/login', async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin) return res.status(400).json({ error: 'PIN requis' });
        
        const user = await db.get('SELECT id, name, role, pin, location FROM users WHERE pin = ?', [pin]);
        if (user) {
            res.json({ 
                success: true, 
                token: pin,
                user: { id: user.id, name: user.name, role: user.role, location: user.location }
            });
        } else {
            res.status(401).json({ success: false, error: 'PIN incorrect' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==================== PAIEMENTS PI & FEDAPAY ====================

app.post('/api/pi/approve', async (req, res) => {
    try {
        const { paymentId } = req.body;
        await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`, 
            {}, 
            { 
                headers: { 
                    'Authorization': `Key ${PI_KEY}`, 
                    'Content-Type': 'application/json' 
                } 
            }
        );
        res.json({ success: true, approved: true });
    } catch (error) {
        console.error('Pi approve error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Erreur Pi Network' });
    }
});

app.post('/api/orders/pi', async (req, res) => {
    try {
        const { paymentId, txid, amount, items } = req.body;
        
        await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`, 
            { txid }, 
            { 
                headers: { 
                    'Authorization': `Key ${PI_KEY}`, 
                    'Content-Type': 'application/json' 
                } 
            }
        );
        
        await db.run('BEGIN TRANSACTION');
        try {
            for (const item of items) {
                await db.run('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?', 
                    [item.quantity, item.id, item.quantity]);
            }
            
            await db.run(
                `INSERT INTO orders (id, txid, customerName, total, items, status, paymentMethod, createdAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [paymentId, txid, 'Client Pi', amount, JSON.stringify(items), 'completed', 'pi_network', new Date().toISOString()]
            );
            
            await db.run('COMMIT');
            res.status(201).json({ success: true });
        } catch (dbError) {
            await db.run('ROLLBACK');
            throw dbError;
        }
    } catch (error) {
        console.error('Pi complete error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Erreur lors de la validation Pi' });
    }
});

app.post('/api/mobile-money/initiate', async (req, res) => {
    try {
        const { phoneNumber, provider, amountUSD } = req.body;
        
        const transaction = await Transaction.create({
            description: `Achat DKS - ${provider}`,
            amount: Math.round(amountUSD * 100),
            currency: { iso: 'CDF' },
            customer: { 
                firstname: 'Client', 
                lastname: 'DKS', 
                phone_number: { number: phoneNumber, country: 'CD' } 
            }
        });
        
        const token = await transaction.generateToken();
        res.json({ success: true, url: token.url, transaction_id: transaction.id });
    } catch (error) {
        console.error('FedaPay error:', error);
        res.status(500).json({ error: 'Erreur FedaPay: ' + error.message });
    }
});

// 🔍 VÉRIFIER statut paiement FedaPay (Polling) - NOUVEAU
app.get('/api/mobile-money/verify/:id', requireAuth, async (req, res) => {
    try {
        const { id: transactionId } = req.params;
        
        const transaction = await Transaction.find(transactionId);
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction non trouvée' });
        }
        
        await transaction.refresh();
        
        if (transaction.status === 'completed' || transaction.status === 'success') {
            const existingOrder = await db.get('SELECT id FROM orders WHERE txid = ? OR id = ?', [transactionId, transactionId]);
            
            if (!existingOrder) {
                await db.run(
                    `INSERT INTO orders (id, txid, customerName, total, items, status, paymentMethod, createdAt) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        transactionId,
                        transactionId,
                        'Client Mobile Money',
                        transaction.amount / 100,
                        '[]',
                        'completed',
                        'mobile_money',
                        transaction.created_at || new Date().toISOString()
                    ]
                );
            } else {
                await db.run('UPDATE orders SET status = ? WHERE id = ? OR txid = ?', ['completed', transactionId, transactionId]);
            }
        }
        
        res.json({
            status: transaction.status,
            message: transaction.status_message || '',
            amount: transaction.amount,
            currency: transaction.currency?.iso || 'CDF',
            created_at: transaction.created_at,
            updated_at: transaction.updated_at
        });
    } catch (error) {
        console.error('Erreur vérification FedaPay:', error);
        res.status(500).json({ error: 'Erreur vérification: ' + error.message });
    }
});

// 🔄 METTRE À JOUR statut commande (Admin) - NOUVEAU
app.patch('/api/orders/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'completed', 'cancelled', 'failed', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Statut invalide. Valeurs acceptées: ' + validStatuses.join(', ') });
        }
        
        await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        
        const updated = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
        res.json({ success: true, order: updated });
    } catch (error) {
        console.error('Erreur mise à jour statut commande:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// ==================== STATS & RAPPORTS (Admin) ====================

app.get('/api/stats/dashboard', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [
            totalProducts,
            publishedProducts,
            totalOrders,
            totalRevenue,
            totalExpenses
        ] = await Promise.all([
            db.get('SELECT COUNT(*) as count FROM products'),
            db.get('SELECT COUNT(*) as count FROM products WHERE published = 1'),
            db.get('SELECT COUNT(*) as count FROM orders'),
            db.get('SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE status = "completed"'),
            db.get('SELECT COALESCE(SUM(amount), 0) as sum FROM expenses')
        ]);
        
        res.json({
            totalProducts: totalProducts?.count || 0,
            publishedProducts: publishedProducts?.count || 0,
            totalOrders: totalOrders?.count || 0,
            totalRevenue: totalRevenue?.sum || 0,
            totalExpenses: totalExpenses?.sum || 0,
            netProfit: (totalRevenue?.sum || 0) - (totalExpenses?.sum || 0)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== UTILITAIRES ====================

// 🏥 Health check - NOUVEAU
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: db ? 'connected' : 'disconnected',
        version: process.env.npm_package_version || '1.0.0'
    });
});

// 💾 Backup base de données (Admin) - NOUVEAU
app.post('/api/backup', requireAuth, requireAdmin, async (req, res) => {
    try {
        const dbPath = path.join(__dirname, 'dks_database.db');
        const backupDir = path.join(__dirname, 'backups');
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `dks_backup_${timestamp}.db`);
        
        fs.copyFileSync(dbPath, backupPath);
        
        res.json({
            success: true,
            message: 'Backup créé avec succès',
            backupFile: backupPath,
            size: fs.statSync(backupPath).size
        });
    } catch (error) {
        console.error('Erreur backup:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde: ' + error.message });
    }
});

// ==================== SERVING FRONTEND (Production) ====================

// ==================== DÉMARRAGE SÉCURISÉ DKS ====================

async function startServer() {
    try {
        // 1. On attend d'abord que SQLite soit prêt
        await initDb(); 

       // 2. Configuration du Frontend
// On essaie de trouver le dossier dist là où il est vraiment
const distPath = fs.existsSync(path.join(__dirname, 'dist')) 
  ? path.join(__dirname, 'dist') 
  : path.join(__dirname, '../dist');

console.log('📂 Serveur : Dossier Frontend trouvé ici ->', distPath);

app.use(express.static(distPath));

app.get('*', (req, res) => {
  // Si c'est une route API qui n'existe pas
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'Route API non trouvée' });
  }
  // Sinon, on envoie toujours l'index.html de React
  res.sendFile(path.join(distPath, 'index.html'));
});


        // 3. Lancement du serveur sur 0.0.0.0
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`💎🚀 Double King Shop Backend prêt sur le port ${PORT}`);
            console.log(`📁 Uploads: ${uploadDir}`);
            console.log(`🗄️ Database: ${path.join(__dirname, 'dks_database.db')}`);
        });
    } catch (err) {
        console.error("❌ Échec critique au démarrage du serveur DKS:", err);
        process.exit(1);
    }
}

// Lancement de la fonction globale
startServer();
