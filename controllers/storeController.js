// controllers/storeController.js
const Store = require('../models/Store');
const Employee = require('../models/Employee'); // 引入 Employee 模型

// 獲取所有商店並顯示
exports.getAllStores = async (req, res) => {
    const stores = await Store.find().populate('store_employees');
    const employees = await Employee.find(); // 獲取所有員工
    res.render('store', { stores, employees }); // 傳遞員工資料到視圖
};

exports.addEmployeeToStore = async (req, res) => {
    const { employeeId } = req.body;
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).send('商店未找到');

    // 檢查員工是否已經在商店中
    if (!store.store_employees.includes(employeeId)) {
        store.store_employees.push(employeeId);
        await store.save();
        res.redirect('/stores');
    } else {
        return res.status(400).send('員工已經在商店中');
    }
}
exports.createStore = async (req, res) => {
    const { store_name, address } = req.body;
    const newStore = new Store({ store_name, address });
    await newStore.save();
    res.redirect('/stores'); // 創建成功後重定向到商店頁面
};
exports.getStoreDetails = async (req, res) => {
    const store = await Store.findById(req.params.id).populate('store_employees');
    if (!store) return res.status(404).send('商店未找到');

    // 計算每位員工的總時數
    const employeeHours = await Promise.all(store.store_employees.map(async (employee) => {
        const emp = await Employee.findById(employee._id);
        const totalHours = emp.attendance.reduce((total, record) => {
            if (record.clockIn && record.clockOut) {
                const hours = (record.clockOut - record.clockIn) / (1000 * 60 * 60); // 計算小時
                return total + hours;
            }
            return total;
        }, 0);
        return { employee: emp, totalHours };
    }));

    res.render('storeDetails', { store, employeeHours }); // 傳遞員工和總時數到視圖
};

// 刪除員工
exports.removeEmployeeFromStore = async (req, res) => {
    const { employeeId } = req.body;
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).send('商店未找到');

    // 從商店中移除員工
    store.store_employees = store.store_employees.filter(emp => emp.toString() !== employeeId);
    await store.save();
    res.redirect(`/stores/${store._id}`); // 重定向到商店詳細頁面
};
exports.getStoreEmployees = async (req, res) => {
    const store = await Store.findById(req.params.id).populate('store_employees');
    if (!store) return res.status(404).send('商店未找到');
    res.json(store.store_employees); // 返回商店的員工
};