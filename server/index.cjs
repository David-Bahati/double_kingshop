require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer'); 
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Remplacez votre ligne 14 par ceci :
app.get('/validation-key.txt', (req, res) => {
      // Le '..' permet de sortir du dossier 'server' pour trouver le fichier à la racine
          res.sendFile(path.join(__dirname, '..', 'validation-key.txt'));
          });


    

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const PI_API_BASE = 'https://api.minepi.com/v2';
const PI_HEADERS = {
  'Authorization': `Key ${process.env.PI_API_SECRET}`,
  'Content-Type': 'application/json'
};

// --- INITIALISATION DE LA BASE DE DONNÉES DKS ---
let db;
(async () => {
  db = await open({
    filename: './dks_database.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      stock INTEGER,
      category TEXT,
      description TEXT,
      image TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      txid TEXT,
      customerName TEXT,
      total REAL,
      items TEXT, 
      status TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      role TEXT,
      pin TEXT,
      location TEXT
    );

    -- NOUVEAU : TABLE DES DÉPENSES --
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      amount REAL,
      category TEXT,
      date TEXT
    );

    -- TABLE DES TAXES --
    CREATE TABLE IF NOT EXISTS taxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      rate REAL,
      type TEXT
    );
  `);

  const userCheck = await db.get('SELECT count(*) as count FROM users');
  if (userCheck.count === 0) {
    await db.run("INSERT INTO users (name, role, pin, location) VALUES ('Admin Double King', 'administrator', '0000', 'Bunia')");
    await db.run("INSERT INTO users (name, role, pin, location) VALUES ('Vendeur DKS', 'vendeur', '1111', 'Bunia')");
    await db.run("INSERT INTO users (name, role, pin, location) VALUES ('Caissier DKS', 'caissier', '2222', 'Bunia')");
  }

  const taxCheck = await db.get('SELECT count(*) as count FROM taxes');
  if (taxCheck.count === 0) {
    await db.run("INSERT INTO taxes (name, rate, type) VALUES ('TVA', 0.18, 'percentage')");
  }
  
  console.log("-------------------------------------------");
  console.log("🗄️ BASE DE DONNÉES DKS CONNECTÉE (SQLITE)");
  console.log("-------------------------------------------");
})();

// --- AUTHENTIFICATION ---
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

// --- PRODUITS ---
app.get('/api/products', async (req, res) => {
  const products = await db.all('SELECT * FROM products ORDER BY id DESC');
  res.json(products);
});

app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, price, stock, category, description } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '/uploads/default.jpg';
    const createdAt = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO products (name, price, stock, category, description, image, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, parseFloat(price), parseInt(stock), category, description, imagePath, createdAt]
    );
    res.status(201).json({ id: result.lastID, name, price, stock, image: imagePath });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- COMMANDES ---
app.get('/api/orders', async (req, res) => {
  const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
  const formattedOrders = orders.map(o => ({ ...o, items: JSON.parse(o.items || '[]') }));
  res.json(formattedOrders);
});

// --- PAIEMENT PI ---
app.post('/api/pi/approve', async (req, res) => {
  const { paymentId } = req.body;
  try {
    await axios.post(`${PI_API_BASE}/payments/${paymentId}/approve`, {}, { headers: PI_HEADERS });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur approbation Pi:', error);
    res.status(500).json({ error: 'Erreur approbation Pi' });
  }
});

app.post('/api/pi/complete', async (req, res) => {
  const { paymentId, txid, cartItems } = req.body;
  try {
    await axios.post(`${PI_API_BASE}/payments/${paymentId}/complete`, { txid }, { headers: PI_HEADERS });
    let totalOrder = 0;
    let itemsNames = [];

    for (const item of cartItems) {
      const product = await db.get('SELECT * FROM products WHERE id = ?', [item.id]);
      if (product) {
        const qty = item.quantity || 1;
        await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, item.id]);
        totalOrder += (product.price * qty);
        itemsNames.push(`${product.name} (x${qty})`);
      }
    }

    const orderId = paymentId.slice(-8).toUpperCase();
    await db.run(
      `INSERT INTO orders (id, txid, customerName, total, items, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, txid, "Client Pi App", totalOrder, JSON.stringify(itemsNames), 'completed', new Date().toISOString()]
    );
    res.json({ success: true, orderId });
  } catch (error) { res.status(500).json({ error: 'Erreur Pi' }); }
});

// --- POS / CASH SALE ---
app.post('/api/pos/cash-sale', async (req, res) => {
  const { cartItems, customerName, total } = req.body;
  try {
    let itemsSummary = [];
    for (const item of cartItems) {
      await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
      itemsSummary.push(`${item.name} (x${item.quantity})`);
    }
    const orderId = "CASH-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    await db.run(
      `INSERT INTO orders (id, txid, customerName, total, items, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, "CASH_PAYMENT", customerName || "Client Comptant", total, JSON.stringify(itemsSummary), 'completed', new Date().toISOString()]
    );
    res.json({ success: true, orderId });
  } catch (error) { res.status(500).json({ error: "Erreur vente cash" }); }
});

// --- NOUVEAU : GESTION DES DÉPENSES ---
app.post('/api/expenses', async (req, res) => {
  const { description, amount, category } = req.body;
  try {
    await db.run(
      `INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)`,
      [description, parseFloat(amount), category, new Date().toISOString()]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erreur enregistrement dépense" }); }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await db.all('SELECT * FROM expenses ORDER BY date DESC');
    res.json(expenses);
  } catch (error) { res.status(500).json({ error: "Erreur lecture dépenses" }); }
});

// --- GESTION DES UTILISATEURS ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.all('SELECT id, name, role, location FROM users ORDER BY id DESC');
    res.json(users);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/users', async (req, res) => {
  const { name, role, pin, location } = req.body;
  try {
    const result = await db.run(
      'INSERT INTO users (name, role, pin, location) VALUES (?, ?, ?, ?)',
      [name, role, pin, location]
    );
    res.status(201).json({ id: result.lastID, name, role, location });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role, pin, location } = req.body;
  try {
    await db.run(
      'UPDATE users SET name = ?, role = ?, pin = ?, location = ? WHERE id = ?',
      [name, role, pin, location, id]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- GESTION DES TAXES ---
app.get('/api/taxes', async (req, res) => {
  try {
    const taxes = await db.all('SELECT * FROM taxes ORDER BY id DESC');
    res.json(taxes);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/taxes', async (req, res) => {
  const { name, rate, type } = req.body;
  try {
    const result = await db.run(
      'INSERT INTO taxes (name, rate, type) VALUES (?, ?, ?)',
      [name, parseFloat(rate), type]
    );
    res.status(201).json({ id: result.lastID, name, rate, type });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/taxes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, rate, type } = req.body;
  try {
    await db.run(
      'UPDATE taxes SET name = ?, rate = ?, type = ? WHERE id = ?',
      [name, parseFloat(rate), type, id]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/taxes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM taxes WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- PAIEMENT MOBILE MONEY ---
app.post('/api/mobile-money/initiate', async (req, res) => {
  const { phoneNumber, provider, amount, items } = req.body;
  try {
    // Simulation d'appel à l'API Mobile Money
    // En production, intégrer avec l'API réelle du fournisseur (Airtel, Orange, etc.)
    const transactionId = `MM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Ici, on simule l'initiation
    console.log(`Initiating ${provider} payment for ${phoneNumber}, amount: ${amount} CDF`);

    res.json({
      success: true,
      transactionId,
      message: `Paiement initié avec ${provider.toUpperCase()}. Veuillez confirmer sur votre téléphone.`
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur initiation paiement Mobile Money' });
  }
});

app.post('/api/mobile-money/confirm', async (req, res) => {
  const { transactionId, cartItems, totalAmount, phoneNumber, provider } = req.body;
  try {
    // Simulation de confirmation
    console.log(`Confirming transaction ${transactionId}`);

    // Enregistrer la commande comme pour Pi
    let totalOrder = totalAmount;
    let itemsNames = [];

    for (const item of cartItems) {
      const product = await db.get('SELECT * FROM products WHERE id = ?', [item.id]);
      if (product) {
        const qty = item.quantity || 1;
        await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, item.id]);
        itemsNames.push(`${product.name} (x${qty})`);
      }
    }

    const orderId = `MM-${transactionId.slice(-8).toUpperCase()}`;
    await db.run(
      `INSERT INTO orders (id, txid, customerName, total, items, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, transactionId, `Mobile Money (${provider}) - ${phoneNumber}`, totalOrder, JSON.stringify(itemsNames), 'completed', new Date().toISOString()]
    );

    res.json({
      success: true,
      orderId,
      message: 'Paiement Mobile Money confirmé'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur confirmation paiement Mobile Money' });
  }
});

// --- BACKUP DE LA BASE DE DONNÉES ---
app.get('/api/backup', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const backupFileName = `dks_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.db`;
    const backupPath = path.join(__dirname, 'backups', backupFileName);
    
    // Créer le dossier backups s'il n'existe pas
    if (!fs.existsSync(path.join(__dirname, 'backups'))) {
      fs.mkdirSync(path.join(__dirname, 'backups'));
    }
    
    // Copier le fichier de base de données
    fs.copyFileSync('./dks_database.db', backupPath);
    
    res.json({
      success: true,
      message: 'Sauvegarde créée avec succès',
      backupFile: backupFileName
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
});

// Ajoute ceci juste avant 'const PORT = 3001;'
app.get('/', (req, res) => {
    res.json({ message: "L'API Double King Shop tourne sur le port 3001", status: "OK" });
    });
const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SERVEUR DKS SÉCURISÉ SUR PORT ${PORT}`);
          // ... le reste du code
          });

