// controllers/attendanceController.js
const Employee = require('../models/Employee');

exports.clockIn = async (req, res) => {
    const employeeId = req.params.employeeId;
    const clockInTime = new Date();

    // 獲取員工的考勤紀錄
    const employee = await Employee.findById(employeeId);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // 檢查今天是否有上班紀錄且沒有下班紀錄
    const hasClockIn = employee.attendance.some(record => 
        record.clockIn >= todayStart && record.clockIn < todayEnd && !record.clockOut
    );

    // 檢查今天是否有下班紀錄
    const hasClockOut = employee.attendance.some(record => 
        record.clockOut >= todayStart && record.clockOut < todayEnd
    );

    if (hasClockIn) {
        return res.status(400).json({ message: '今天已經有上班紀錄，無法再次上班。' });
    }

    // 更新員工的考勤記錄
    await Employee.findByIdAndUpdate(employeeId, {
        $push: { attendance: { clockIn: clockInTime } }
    });

    res.sendStatus(200); // 返回成功狀態
};

exports.clockOut = async (req, res) => {
    const employeeId = req.params.employeeId;
    const clockOutTime = new Date();

    // 獲取員工的考勤紀錄
    const employee = await Employee.findById(employeeId);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // 檢查今天是否有上班紀錄
    const clockInRecord = employee.attendance.find(record => 
        record.clockIn >= todayStart && record.clockIn < todayEnd && !record.clockOut
    );

    if (!clockInRecord) {
        return res.status(400).json({ message: '今天沒有上班紀錄，無法下班。' });
    }

    // 更新員工的考勤記錄，找到最近的 clockIn 並更新 clockOut
    await Employee.findOneAndUpdate(
        { _id: employeeId, 'attendance._id': clockInRecord._id },
        { $set: { 'attendance.$.clockOut': clockOutTime } }
    );

    res.sendStatus(200); // 返回成功狀態
};