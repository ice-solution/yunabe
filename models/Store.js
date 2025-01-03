// models/Store.js
const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    store_name: { type: String, required: true }, // 商店名稱
    address: { type: String, default: null },       // 地址，可以為空
    store_employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }] // 員工ID的數組
});

module.exports = mongoose.model('Store', storeSchema);