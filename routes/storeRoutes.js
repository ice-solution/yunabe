// routes/storeRoutes.js
const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const storeController = require('../controllers/storeController');

// 創建商店
router.post('/', storeController.createStore);

// 獲取所有商店並顯示
router.get('/', storeController.getAllStores);

// 獲取特定商店
// router.get('/:id', async (req, res) => {
//     const store = await Store.findById(req.params.id).populate('store_employees');
//     if (!store) return res.status(404).send('商店未找到');
//     res.json(store);
// });
router.get('/:id', storeController.getStoreDetails);

// 更新商店
router.put('/:id', async (req, res) => {
    const { store_name, address } = req.body;
    const updatedStore = await Store.findByIdAndUpdate(req.params.id, { store_name, address }, { new: true });
    if (!updatedStore) return res.status(404).send('商店未找到');
    res.json(updatedStore);
});

// 刪除商店
router.delete('/:id', async (req, res) => {
    const deletedStore = await Store.findByIdAndDelete(req.params.id);
    if (!deletedStore) return res.status(404).send('商店未找到');
    res.send('商店已刪除');
});

// 將員工添加到商店
router.post('/:id/employees/remove', storeController.removeEmployeeFromStore); // 刪除員工的路由

router.post('/:id/employees', storeController.addEmployeeToStore); // 添加員工的路由
// router.post('/:id/employees', async (req, res) => {

// });
router.get('/:id/employees', storeController.getStoreEmployees); // 新增的路由


module.exports = router;