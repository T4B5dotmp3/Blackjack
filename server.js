// server.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('/models/User'); // Import the model we just made

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// --- MONGODB CONNECTION ---
// Replace the string below with your actual connection string from MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pokerDB';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// --- ROUTES ---

// 1. Serve HTML Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));

// 2. Handle Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.send("User already exists. Try a different username.");
        }

        // Hash the password (security best practice)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with default 1000 credits
        const newUser = new User({
            username,
            password: hashedPassword,
            credits: 0
        });

        await newUser.save();
        
        // Send them to login page after success
        res.redirect('/login');
        
    } catch (err) {
        console.error(err);
        res.send("Error registering user.");
    }
});

// 3. Handle Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.send("User not found.");
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.send("Invalid credentials.");
        }

        // LOGIN SUCCESS!
        // For now, we just send a message. Ideally, you'd start a session here.
        res.send(`Welcome back, ${user.username}! You have $${user.credits}`);

    } catch (err) {
        console.error(err);
        res.send("Error logging in.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));