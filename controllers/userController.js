// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 登入
exports.login = async (req, res) => {
    const { login_id, password } = req.body;
    const user = await User.findOne({ login_id });

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user; // 將用戶資訊存入 session
        return res.redirect('/admin'); // 登入成功，重定向到管理頁面
    }
    res.status(401).send('登入失敗，請檢查登入ID和密碼。');
};

// 檢查是否為 admin
exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next(); // 允許進入管理頁面
    }
    res.redirect('/login'); // 不是 admin，重定向到登入頁面
};

// 登出
exports.logout = (req, res) => {
    req.session.destroy(); // 銷毀 session
    res.redirect('/login'); // 重定向到登入頁面
};