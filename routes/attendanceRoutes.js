// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const Store = require('../models/Store');


router.get('/', async (req, res) => {
    const stores = await Store.find(); // 獲取所有商店
    res.render('attendance', { stores }); // 渲染考勤管理頁面
});
// 上班
router.post('/:employeeId/clockIn', attendanceController.clockIn);

// 下班
router.post('/:employeeId/clockOut', attendanceController.clockOut);

module.exports = router;