// app.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const storeRoutes = require('./routes/storeRoutes'); // 引入 storeRoutes
const User = require('./models/User'); // 引入 User 模型
const bcrypt = require('bcrypt');
const attendanceRoutes = require('./routes/attendanceRoutes'); // 引入 attendanceRoutes
const reportRoutes = require('./routes/reportRoutes'); // 引入 reportRoutes


dotenv.config();
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // 解析 JSON 請求
app.use(express.static('public'));

// 設定 session
app.use(session({
    secret: 'ryunabe', // 請更改為安全的密鑰
    resave: false,
    saveUninitialized: true
}));

// 連接到 MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
        createAdminUser(); // 創建 admin 用戶
    })
    .catch(err => console.error(err));

// 使用路由
app.use('/', userRoutes);
app.use('/employees', employeeRoutes); // 使用 employeeRoutes
app.use('/stores', storeRoutes); // 使用 storeRoutes
app.use('/attendance', attendanceRoutes);
app.use('/reports', reportRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// 創建 admin 用戶的函數
async function createAdminUser() {
    const adminExists = await User.findOne({ login_id: 'admin' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin_password', 10); // 將 'admin_password' 替換為你想要的密碼
        const adminUser = new User({
            login_id: 'admin',
            password: hashedPassword,
            role: 'admin'
        });
        await adminUser.save();
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }
}