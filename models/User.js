// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    login_id: { type: String, required: true, unique: true }, // 登入ID，必填且唯一
    password: { type: String, required: true },               // 密碼，必填
    role: { 
        type: String, 
        enum: ['admin', 'user'],                               // 角色，僅限於 admin 和 user
        required: true 
    }
});

module.exports = mongoose.model('User', userSchema);