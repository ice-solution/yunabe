// models/Employee.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    clockIn: { type: Date, required: true },
    clockOut: { type: Date }
});

const employeeSchema = new mongoose.Schema({
    employee_name: { type: String, required: true }, // 員工姓名
    salary_h: { type: Number, required: true },      // 每小時工資
    OT_h: { type: Number, required: true },          // 加班每小時工資
    attendance: [attendanceSchema]                    // 上下班記錄數組
});

module.exports = mongoose.model('Employee', employeeSchema);