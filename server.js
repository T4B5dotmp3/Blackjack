require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('./models/User');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.warn('Warning: MONGO_URI is not set. Skipping MongoDB connection. Set MONGO_URI in a .env file to enable persistence.');
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.error('MongoDB connection error:', err));
}

// --- ROUTES ---

// 1. Make LOGIN the default first page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html')); 
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// 2. Handle Registration (Returns JSON now)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword,
            credits: 1000
        });

        await newUser.save();
        
        // SUCCESS: Send signal to frontend
        res.json({ success: true, username: username });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 3. Handle Login (Returns JSON now)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // SUCCESS: Send signal to frontend
        res.json({ success: true, username: user.username });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));