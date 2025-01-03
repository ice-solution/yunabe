// routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// 獲取所有員工並顯示
router.get('/', employeeController.getAllEmployees);

// 顯示創建員工的表單
router.get('/create', (req, res) => {
    res.render('createEmployee'); // 渲染創建員工的表單
});

// 創建新員工
router.post('/', employeeController.createEmployee);

// 編輯員工頁面
router.get('/edit/:id', employeeController.editEmployeePage);

// 更新員工
router.post('/:id', employeeController.updateEmployee);

// 刪除員工
router.post('/:id', employeeController.deleteEmployee);

module.exports = router;