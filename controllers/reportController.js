// controllers/reportController.js
const Employee = require('../models/Employee'); // 引入 Employee 模型
const ExcelJS = require('exceljs');
const path = require('path'); // 引入 path 模組
const fs = require('fs'); // 引入 fs 模組

exports.generateReport = async (req, res) => {
    const { fromDate, toDate, type } = req.body;

    if (type === 'overall') {
        const workbook = new ExcelJS.Workbook();

        // 獲取所有員工的考勤資料
        const employees = await Employee.find();
        
        for (const employee of employees) {
            const worksheet = workbook.addWorksheet(employee.employee_name); // 每位員工一個工作表

            // 添加表頭
            worksheet.columns = [
                { header: '上班時間', key: 'clock_in', width: 30 },
                { header: '下班時間', key: 'clock_out', width: 30 },
                { header: '工作時數', key: 'hours_worked', width: 15 },
                { header: '當天人工', key: 'daily_salary', width: 15 }
            ];

            let totalHours = 0;
            let totalSalary = 0;

            const attendanceRecords = employee.attendance.filter(record => 
                new Date(record.clockIn) >= new Date(fromDate) && 
                new Date(record.clockIn) <= new Date(toDate)
            );

            for (const record of attendanceRecords) {
                const clockIn = new Date(record.clockIn);
                const clockOut = new Date(record.clockOut);

                // 計算每15分鐘的工時
                let currentTime = new Date(clockIn);
                let hoursWorked = 0;

                // 計算從打卡到下班的每15分鐘
                let maxIterations = 1000; // 最大迭代次數
                let iterations = 0; // 當前迭代次數
                
                while (currentTime < clockOut && iterations < maxIterations) {
                    const nextCheckpoint = new Date(currentTime);
                    
                    // 向上取整到最近的15分鐘
                    if (currentTime.getMinutes() % 15 === 0) {
                        nextCheckpoint.setMinutes(currentTime.getMinutes() + 15);
                    } else {
                        nextCheckpoint.setMinutes(Math.ceil(currentTime.getMinutes() / 15) * 15);
                    }
                
                    // 如果下一個檢查點超過下班時間，則計算剩餘時間
                    if (nextCheckpoint > clockOut) {
                        const remainingMinutes = (clockOut - currentTime) / (1000 * 60); // 剩餘時間（分鐘）
                        hoursWorked += remainingMinutes / 60; // 計算剩餘時間的工時
                        break; // 停止計算
                    }
                
                    // 計算工時
                    hoursWorked += 0.25; // 每15分鐘計算0.25小時
                    currentTime = nextCheckpoint; // 更新當前時間到下一個檢查點
                
                    // 日誌輸出
                    console.log(`Current Time: ${currentTime}, Next Checkpoint: ${nextCheckpoint}, Clock Out: ${clockOut}`);
                    
                    iterations++; // 增加迭代次數
                }
                
                // 檢查是否達到最大迭代次數
                if (iterations >= maxIterations) {
                    console.error('Reached maximum iterations, possible infinite loop detected.');
                }

                const salaryPerHour = employee.salary_h; // 每小時工資
                const dailySalary = (salaryPerHour / 4) * (hoursWorked * 4); // 每15分鐘計算

                worksheet.addRow({
                    clock_in: clockIn.toLocaleString(),
                    clock_out: clockOut.toLocaleString(),
                    hours_worked: Math.floor(hoursWorked), // 不顯示小數點
                    daily_salary: Math.floor(dailySalary) // 不顯示小數點
                });

                totalHours += hoursWorked;
                totalSalary += dailySalary;
            }

            // 添加總結行
            worksheet.addRow({});
            worksheet.addRow({
                clock_in: '總計',
                hours_worked: Math.floor(totalHours), // 不顯示小數點
                daily_salary: Math.floor(totalSalary) // 不顯示小數點
            });
        }

        // 生成 Excel 文件
        const reportFileName = `overall_report_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '../public/reports', reportFileName); // 設定文件路徑
        await workbook.xlsx.writeFile(filePath);

        // 返回下載鏈接
        res.json({ downloadUrl: `/reports/${reportFileName}` });
    } else if (type === 'individual') {
        const employeeId = req.body.employeeId; // 假設從請求中獲取員工 ID
        const employee = await Employee.findById(employeeId);

        if (!employee) {
            return res.status(404).send('員工未找到');
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(employee.employee_name); // 每位員工一個工作表

        // 添加表頭
        worksheet.columns = [
            { header: '上班時間', key: 'clock_in', width: 30 },
            { header: '下班時間', key: 'clock_out', width: 30 },
            { header: '工作時數', key: 'hours_worked', width: 15 },
            { header: '當天人工', key: 'daily_salary', width: 15 }
        ];

        let totalHours = 0;
        let totalSalary = 0;

        const attendanceRecords = employee.attendance.filter(record => 
            new Date(record.clockIn) >= new Date(fromDate) && 
            new Date(record.clockIn) <= new Date(toDate)
        );

        for (const record of attendanceRecords) {
            const clockIn = new Date(record.clockIn);
            const clockOut = new Date(record.clockOut);

            // 計算每15分鐘的工時
            let currentTime = new Date(clockIn);
            let hoursWorked = 0;

            // 計算從打卡到下班的每15分鐘
            while (currentTime < clockOut) {
                const nextCheckpoint = new Date(currentTime);
                nextCheckpoint.setMinutes(Math.ceil(currentTime.getMinutes() / 15) * 15); // 向上取整到最近的15分鐘

                // 如果下一個檢查點超過下班時間，則計算剩餘時間
                if (nextCheckpoint > clockOut) {
                    const remainingMinutes = (clockOut - currentTime) / (1000 * 60); // 剩餘時間（分鐘）
                    hoursWorked += remainingMinutes / 60; // 計算剩餘時間的工時
                    break; // 停止計算
                }

                // 計算工時
                hoursWorked += 0.25; // 每15分鐘計算0.25小時
                currentTime = nextCheckpoint; // 更新當前時間到下一個檢查點
            }

            const salaryPerHour = employee.salary_h; // 每小時工資
            const dailySalary = (salaryPerHour / 4) * (hoursWorked * 4); // 每15分鐘計算

            worksheet.addRow({
                clock_in: clockIn.toLocaleString(),
                clock_out: clockOut.toLocaleString(),
                hours_worked: Math.floor(hoursWorked), // 不顯示小數點
                daily_salary: Math.floor(dailySalary) // 不顯示小數點
            });

            totalHours += hoursWorked;
            totalSalary += dailySalary;
        }

        // 添加總結行
        worksheet.addRow({});
        worksheet.addRow({
            clock_in: '總計',
            hours_worked: Math.floor(totalHours), // 不顯示小數點
            daily_salary: Math.floor(totalSalary) // 不顯示小數點
        });

        // 生成 Excel 文件
        const reportFileName = `individual_report_${employeeId}_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '../public/reports', reportFileName); // 設定文件路徑
        await workbook.xlsx.writeFile(filePath);

        // 返回下載鏈接
        res.json({ downloadUrl: `/reports/${reportFileName}` });
    }
};