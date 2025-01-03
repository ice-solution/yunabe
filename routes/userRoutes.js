// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 登入頁面
router.get('/login', (req, res) => {
    res.render('login');
});

// 處理登入請求
router.post('/login', userController.login);

// 管理頁面
router.get('/admin', userController.isAdmin, (req, res) => {
    res.render('admin');
});

// 登出
router.get('/logout', userController.logout);

module.exports = router;