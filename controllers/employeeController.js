// controllers/employeeController.js
const Employee = require('../models/Employee');

// 獲取所有員工並顯示
exports.getAllEmployees = async (req, res) => {
    const employees = await Employee.find();
    res.render('employee', { employees });
};

// 創建新員工
exports.createEmployee = async (req, res) => {
    const { employee_name, salary_h, OT_h } = req.body;
    const newEmployee = new Employee({ employee_name, salary_h, OT_h, OT_time });
    await newEmployee.save();
    res.redirect('/employees'); // 創建成功後重定向到員工頁面
};

// 編輯員工頁面
exports.editEmployeePage = async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).send('員工未找到');
    res.render('editEmployee', { employee });
};

// 更新員工
exports.updateEmployee = async (req, res) => {
    const { employee_name, salary_h, OT_h, OT_time } = req.body;
    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, { employee_name, salary_h, OT_h,OT_time }, { new: true });
    if (!updatedEmployee) return res.status(404).send('員工未找到');
    res.redirect('/employees'); // 更新成功後重定向到員工頁面
};

// 刪除員工
exports.deleteEmployee = async (req, res) => {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) return res.status(404).send('員工未找到');
    res.redirect('/employees'); // 刪除成功後重定向到員工頁面
};