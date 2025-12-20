require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- MONGODB ---
const MONGO_URI = process.env.MONGO_URI; 
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error:', err));

// --- FILE HELPER ---
const renderPage = (res, fileName, type = 'text/html') => {
    const fullPath = path.join(__dirname, fileName);
    if (fs.existsSync(fullPath)) {
        res.setHeader('Content-Type', type);
        res.send(fs.readFileSync(fullPath, 'utf8'));
    } else {
        res.status(404).send(`Error: File ${fileName} not found.`);
    }
};

// --- ROUTES ---

// HTML Pages
app.get('/', (req, res) => renderPage(res, 'login.html'));
app.get('/login', (req, res) => renderPage(res, 'login.html'));
app.get('/register', (req, res) => renderPage(res, 'register.html'));
app.get('/dashboard', (req, res) => renderPage(res, 'dashboard.html'));
app.get('/buy-credits', (req, res) => renderPage(res, 'buy-credits.html'));
app.get('/payment', (req, res) => renderPage(res, 'payment.html'));
app.get('/poker', (req, res) => renderPage(res, 'poker.html'));
// NEW: Account Page
app.get('/account', (req, res) => renderPage(res, 'account.html')); 

// CSS
app.get('/style.css', (req, res) => renderPage(res, 'style.css', 'text/css'));

// --- LOGIC ROUTES ---

// 1. Get User Stats (For Account Page)
app.post('/my-stats', async (req, res) => {
    const { username } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.json({ success: false });
        
        res.json({ 
            success: true, 
            credits: user.credits,
            netEarnings: user.netEarnings,
            totalWithdrawn: user.totalWithdrawn
        });
    } catch (err) { res.json({ success: false }); }
});

// 2. Handle Withdrawal
app.post('/withdraw', async (req, res) => {
    const { username, amount } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        const withdrawAmount = parseInt(amount);
        if (user.credits < withdrawAmount) {
            return res.json({ success: false, message: "Not enough credits!" });
        }

        // Logic
        user.credits -= withdrawAmount;
        user.totalWithdrawn += withdrawAmount;
        await user.save();

        res.json({ success: true, newBalance: user.credits });
    } catch (err) { res.status(500).json({ success: false }); }
});

// 3. Game Result (Updates Wins/Losses/Net)
app.post('/game-result', async (req, res) => {
    const { username, betAmount, winAmount } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        // Update Stats
        const bet = parseInt(betAmount) || 0;
        const win = parseInt(winAmount) || 0;

        user.totalLost += bet;      // Add to lifetime losses
        user.totalWon += win;       // Add to lifetime wins
        user.credits = user.credits - bet + win; // Update current balance
        
        // Recalculate Net Earnings
        user.netEarnings = user.totalWon - user.totalLost;

        await user.save();
        res.json({ success: true, credits: user.credits });

    } catch (err) { res.status(500).json({ success: false }); }
});

// 4. Add Credits (Buying)
app.post('/add-credits', async (req, res) => {
    const { username, amount } = req.body;
    try {
        const user = await User.findOne({ username });
        user.credits += parseInt(amount);
        await user.save();
        res.json({ success: true, newBalance: user.credits });
    } catch (err) { res.status(500).json({ success: false }); }
});

// Auth Routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ success: false, message: "User exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, credits: 1000 });
        await newUser.save();
        res.json({ success: true, username, credits: 1000 });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        res.json({ success: true, username: user.username, credits: user.credits });
    } catch (err) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));