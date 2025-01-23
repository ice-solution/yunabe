// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// 獲取報告頁面
// router.get('/', (req, res) => {
//     const employees = await Employee.find();
//     res.render('reports'); // 渲染報告頁面
// });
router.get('/', reportController.getReportPage);
// 生成報告
router.post('/generate', reportController.generateReport); // 生成報告的路由

module.exports = router;