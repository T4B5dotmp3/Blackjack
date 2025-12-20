const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },

    credits: { 
        type: Number, 
        default: 0 
    },
    // New Stats Tracking
    totalWon: { type: Number, default: 0 },      // Total money won from pots
    totalLost: { type: Number, default: 0 },     // Total money bet/lost
    netEarnings: { type: Number, default: 0 },   // Won - Lost
    totalWithdrawn: { type: Number, default: 0 } // Amount "cashed out"
});

module.exports = mongoose.model('User', UserSchema);