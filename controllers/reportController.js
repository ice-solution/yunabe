// controllers/reportController.js
const Employee = require('../models/Employee'); // 引入 Employee 模型
const ExcelJS = require('exceljs');
const path = require('path'); // 引入 path 模組
const fs = require('fs'); // 引入 fs 模組

exports.getReportPage = async (req, res) => {
    const employees = await Employee.find();
    res.render('reports',{ employees }); // 渲染報告頁面
}
exports.generateReport = async (req, res) => {
    const { fromDate, toDate, type, employeeId } = req.body;

    if (type === 'overall') {
        const workbook = new ExcelJS.Workbook();

        // 獲取所有員工的考勤資料
        const employees = await Employee.find();
        
        for (const employee of employees) {
            const worksheet = workbook.addWorksheet(employee.employee_name); // 每位員工一個工作表

            // 添加表頭
            worksheet.columns = [
                { header: '上班時間', key: 'clock_in', width: 25 }, // 設置 A 欄寬度
                { header: '下班時間', key: 'clock_out', width: 25 }, // 設置 B 欄寬度
                { header: '工作時數', key: 'hours_worked', width: 15 },
                { header: 'OT 時數', key: 'ot_hours', width: 15 }, // OT 時數
                { header: '薪水', key: 'daily_salary', width: 15 },
                { header: 'OT 薪水', key: 'ot_salary', width: 15 }, // OT 薪水
                { header: '總薪水', key: 'total_salary', width: 15 } // 總薪水
            ];

            let totalHours = 0;
            let totalSalary = 0;
            let totalOTHours = 0;
            let totalOTSalary = 0;

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
                let dailySalary = 0;
                let dailyOTSalary = 0; // 每天的 OT 薪水
                let dailyOTHours = 0; // 每天的 OT 時數

                // 計算從打卡到下班的每15分鐘
                let maxIterations = 1000; // 最大迭代次數
                let iterations = 0; // 當前迭代次數
                
                while (currentTime < clockOut && iterations < maxIterations) {
                    const nextCheckpoint = new Date(currentTime);
                    nextCheckpoint.setMinutes(currentTime.getMinutes() + 15); // 每次增加15分鐘

                    // 計算 OT_time 的閾值
                    let otThreshold;
                    if (employee.OT_time && employee.OT_time.trim() !== '') {
                        const [otHour, otMinute] = employee.OT_time.split(':').map(Number);
                        otThreshold = new Date(currentTime);
                        otThreshold.setHours(otHour, otMinute, 0, 0); // 設置加班時間，僅保留時間部分
                        // const utcOffset = 8 * 60; // GMT+8 的分鐘數
                        otThreshold.setMinutes(otThreshold.getMinutes());
                    }

                    // 如果下一個檢查點超過下班時間，則計算剩餘時間
                    if (nextCheckpoint > clockOut) {
                        const remainingMinutes = (clockOut - currentTime) / (1000 * 60); // 剩餘時間（分鐘）
                        if (remainingMinutes < 15) {
                            break; // 停止計算
                        }
                        hoursWorked += Math.floor(remainingMinutes / 60); // 計算剩餘時間的工時
                        break; // 停止計算
                    }

                    // 計算工時
                    if (otThreshold && currentTime >= otThreshold) {
                        dailyOTSalary += (employee.OT_h / 4) * 0.25; // 每15分鐘計算 OT 薪水
                        dailyOTHours += 0.25; // 每15分鐘計算 OT 時數
                    } else {
                        dailySalary += (employee.salary_h / 4) * 0.25; // 每15分鐘計算正常薪水
                    }

                    hoursWorked += 0.25; // 每15分鐘計算0.25小時
                    currentTime = nextCheckpoint; // 更新當前時間到下一個檢查點
                
                    iterations++; // 增加迭代次數
                }
                
                // 檢查是否達到最大迭代次數
                if (iterations >= maxIterations) {
                    console.error('Reached maximum iterations, possible infinite loop detected.');
                }

                // 計算當天薪水
                const salaryPerHour = employee.salary_h; // 每小時工資
                const dailySalaryFinal = salaryPerHour * hoursWorked; // 計算當天薪水
                const totalDailySalary = dailySalaryFinal + dailyOTSalary; // 總薪水

                worksheet.addRow({
                    clock_in: clockIn.toLocaleString(),
                    clock_out: clockOut.toLocaleString(),
                    hours_worked: hoursWorked.toFixed(2), // 顯示小數點後兩位
                    ot_hours: dailyOTHours.toFixed(2), // 顯示小數點後兩位
                    daily_salary: dailySalaryFinal.toFixed(2), // 顯示小數點後兩位
                    ot_salary: dailyOTSalary.toFixed(2), // 顯示小數點後兩位
                    total_salary: totalDailySalary.toFixed(2) // 顯示小數點後兩位
                });

                totalHours += hoursWorked;
                totalSalary += dailySalaryFinal; // 使用最終計算的當天薪水
                totalOTSalary += dailyOTSalary; // 累加 OT 薪水
                totalOTHours += dailyOTHours; // 累加 OT 時數
            }

            // 添加總結行
            worksheet.addRow({});
            worksheet.addRow({
                clock_in: '總計',
                hours_worked: totalHours.toFixed(2), // 顯示小數點後兩位
                ot_hours: totalOTHours.toFixed(2), // 顯示小數點後兩位
                daily_salary: totalSalary.toFixed(2), // 顯示小數點後兩位
                ot_salary: totalOTSalary.toFixed(2), // 顯示小數點後兩位
                total_salary: (totalSalary + totalOTSalary).toFixed(2) // 顯示小數點後兩位
            });
        }

        // 生成 Excel 文件
        const reportFileName = `overall_report_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '../public/reports', reportFileName); // 設定文件路徑
        await workbook.xlsx.writeFile(filePath);

        // 返回下載鏈接
        res.json({ downloadUrl: `/reports/${reportFileName}` });
    } else if (type === 'individual') {
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).send('員工未找到');
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('個人報告');

        // 添加報告標題
        worksheet.addRow([`姓名: ${employee.employee_name}`]);
        worksheet.addRow([`時薪: ${employee.salary_h}`]);
        worksheet.addRow([`OT 時薪: ${employee.OT_h}`]); // 添加 OT 時薪
        worksheet.addRow([`時間由: ${fromDate} 到: ${toDate}`]);
        worksheet.addRow([]);
        worksheet.addRow(['上班時間', '下班時間', '工作時數', 'OT 時數', '薪水', 'OT 薪水', '總薪水']);

        // 設置 A 和 B 欄的寬度
        worksheet.getColumn(1).width = 25; // A欄（上班時間）
        worksheet.getColumn(2).width = 25; // B欄（下班時間）

        let totalHours = 0;
        let totalSalary = 0;
        let totalOTHours = 0;
        let totalOTSalary = 0;

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
            let dailySalary = 0;
            let dailyOTSalary = 0; // 每天的 OT 薪水
            let dailyOTHours = 0; // 每天的 OT 時數

            // 計算從打卡到下班的每15分鐘
            let maxIterations = 1000; // 最大迭代次數
            let iterations = 0; // 當前迭代次數
            
            while (currentTime < clockOut && iterations < maxIterations) {
                const nextCheckpoint = new Date(currentTime);
                nextCheckpoint.setMinutes(currentTime.getMinutes() + 15); // 每次增加15分鐘

                // 計算 OT_time 的閾值
                let otThreshold;
                if (employee.OT_time && employee.OT_time.trim() !== '') {
                    const [otHour, otMinute] = employee.OT_time.split(':').map(Number);
                    otThreshold = new Date(currentTime);
                    otThreshold.setHours(otHour, otMinute, 0, 0); // 設置加班時間，僅保留時間部分
                    otThreshold.setMinutes(otThreshold.getMinutes());
                }

                // 如果下一個檢查點超過下班時間，則計算剩餘時間
                if (nextCheckpoint > clockOut) {
                    const remainingMinutes = (clockOut - currentTime) / (1000 * 60); // 剩餘時間（分鐘）
                    if (remainingMinutes < 15) {
                        break; // 停止計算
                    }
                    hoursWorked += Math.floor(remainingMinutes / 60); // 計算剩餘時間的工時
                    break; // 停止計算
                }

                // 計算工時
                if (otThreshold && currentTime >= otThreshold) {
                    dailyOTSalary += (employee.OT_h / 4) * 0.25; // 每15分鐘計算 OT 薪水
                    dailyOTHours += 0.25; // 每15分鐘計算 OT 時數
                } else {
                    dailySalary += (employee.salary_h / 4) * 0.25; // 每15分鐘計算正常薪水
                }

                hoursWorked += 0.25; // 每15分鐘計算0.25小時
                currentTime = nextCheckpoint; // 更新當前時間到下一個檢查點
            
                iterations++; // 增加迭代次數
            }
            
            // 檢查是否達到最大迭代次數
            if (iterations >= maxIterations) {
                console.error('Reached maximum iterations, possible infinite loop detected.');
            }

            // 計算當天薪水
            const salaryPerHour = employee.salary_h; // 每小時工資
            const dailySalaryFinal = salaryPerHour * hoursWorked; // 計算當天薪水
            const totalDailySalary = dailySalaryFinal + dailyOTSalary; // 總薪水

            worksheet.addRow([
                clockIn.toLocaleString(),
                clockOut.toLocaleString(),
                (hoursWorked).toFixed(2), // 工作時數
                (dailyOTHours).toFixed(2), // OT 時數
                (dailySalaryFinal).toFixed(2), // 薪水
                (dailyOTSalary).toFixed(2), // OT 薪水
                (totalDailySalary).toFixed(2) // 總薪水
            ]);

            totalHours += hoursWorked;
            totalSalary += dailySalaryFinal; // 使用最終計算的當天薪水
            totalOTSalary += dailyOTSalary; // 累加 OT 薪水
            totalOTHours += dailyOTHours; // 累加 OT 時數
        }

        // 添加總結行
        worksheet.addRow([]);
        worksheet.addRow(['員工資料']);
        worksheet.addRow(['時薪', employee.salary_h]);
        worksheet.addRow(['OT 時薪', employee.OT_h]); // 添加 OT 時薪
        worksheet.addRow(['工作總時數', totalHours.toFixed(2)]); // 顯示小數點後兩位
        worksheet.addRow(['OT 時數', totalOTHours.toFixed(2)]); // 顯示小數點後兩位
        worksheet.addRow(['總薪水', (totalSalary + totalOTSalary).toFixed(2)]); // 顯示小數點後兩位

        // 生成 Excel 文件
        const reportFileName = `individual_report_${employeeId}_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '../public/reports', reportFileName);
        await workbook.xlsx.writeFile(filePath);

        // 返回下載鏈接
        res.json({ downloadUrl: `/reports/${reportFileName}` });
    }
};