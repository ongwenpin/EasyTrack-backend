import { Router } from "express";
import { Record } from "../models/recordModel.js";
import dotenv from "dotenv";
import { verifyToken } from "../middlewares/authentication.js";
import { Expense } from "../models/expenseModel.js";
import { Branch } from "../models/branchModel.js";

const router = Router();

dotenv.config();

// Get daily earnings for a specific date
router.get("/api/analytics/dailyearning/:date", verifyToken, async (req, res) => {

    try {
        const date = new Date(req.params.date);
        const records = await Record.find({
            date: date.toISOString().slice(0, 10),
        });
        let branchEarnings = { earning: 0 };

        //const distinctBranches = await Record.distinct("branch");
        const distinctBranches = await Branch.find();
        
        for (let branch of distinctBranches) {
            branchEarnings[branch.branchName] = 0;
        }

        records.forEach((record) => {
            const branch = record.branch;
            const earnings = record.totalEarnings;

            if (!branchEarnings[branch]) {
                branchEarnings[branch] = 0;
            }

            branchEarnings[branch] += earnings;
            branchEarnings.earning += earnings;
        })
        return res.status(200).send(branchEarnings);
    } catch (err) {
        return res.status(500).send("Error getting daily profit.");
    }
    

});

router.get("/api/analytics/weeklyearning/:date", verifyToken, async (req, res) => {

    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const currDate = new Date(req.params.date);
    const currDay = currDate.getDay();
    const startDate = new Date(currDate.getTime() - (currDay * 24 * 60 * 60 * 1000));
    const weeklyEarning = [];

    //const distinctBranches = await Record.distinct("branch");
    const distinctBranches = await Branch.find();

    for (let i = 0; i < 7; i++) {
        try {
            const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
            const dayName = day[i];
            const records = await Record.find({
                date: date.toISOString().slice(0, 10),
            });
            let branchEarnings = {day: dayName, earning: 0};

            for (let branch of distinctBranches) {
                branchEarnings[branch.branchName] = 0;
            }

            records.forEach((record) => {
                const branch = record.branch;
                const earnings = record.totalEarnings;
                
                if (!branchEarnings[branch]) {
                    branchEarnings[branch] = 0;
                }
                
                branchEarnings[branch] += earnings;
                branchEarnings.earning += earnings;
            });

            weeklyEarning.push(branchEarnings);
        } catch (err) {
            return res.status(500).send("Error getting weekly profit.");
        }
    }

    return res.status(200).send(weeklyEarning);
    
});

router.get("/api/analytics/monthlyprofit/", verifyToken, async (req, res) => {

    if (!req.query.month || !req.query.year) {
        return res.status(400).send("Please provide month and year");
    }

    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);

    const monthlyEarning = {};

    try {
        if (month === 11) {
            const records = await Record.find({
                date: { $gte: new Date(year, month, 1), $lt: new Date(year + 1, 0, 1) },
            });
            const expenses = await Expense.find({
                date: { $gte: new Date(year, month, 1), $lt: new Date(year + 1, 0, 1) },
            });
            const earning = records.reduce((acc, record) => {
                return acc + record.totalEarnings;
            }, 0);
            const expense = expenses.reduce((acc, record) => {
                return acc + record.expenseAmount;
            }, 0);
            monthlyEarning["earning"] = earning;
            monthlyEarning["expense"] = expense;
            monthlyEarning["profit"] = earning - expense;
        } else {
            const records = await Record.find({
                date: { $gte: new Date(year, month, 1), $lt: new Date(year, month + 1, 1) },
            });
            const expenses = await Expense.find({
                date: { $gte: new Date(year, month, 1), $lt: new Date(year, month + 1, 1) },
            });
            const earning = records.reduce((acc, record) => {
                return acc + record.totalEarnings;
            }, 0);
            const expense = expenses.reduce((acc, record) => {
                return acc + record.expenseAmount;
            }, 0);
            monthlyEarning["earning"] = earning;
            monthlyEarning["expense"] = expense;
            monthlyEarning["profit"] = earning - expense
            
        }

        return res.status(200).send(monthlyEarning);
        
    } catch (err) {
        return res.status(500).send("Error getting monthly earning.");
    }


});

router.get("/api/analytics/annualprofit", verifyToken, async (req, res) => {

    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const year = new Date().getFullYear();

    const annualEarning = [];

    for (let i = 0; i < 12; i++) {

        try {
            // Find all record within that month and year
            if (i === 11) {
                const records = await Record.find({
                    date: { $gte: new Date(year, i, 1), $lt: new Date(year + 1, 0, 1) },
                });
                let earning = 0;
                records.forEach((record) => {
                    const date = new Date(record.date);
                    if (date.getFullYear() === year && date.getMonth() === i) {
                        earning += record.totalEarnings;
                    }
                });

                const expenses = await Expense.find({
                    date: { $gte: new Date(year, i, 1), $lt: new Date(year + 1, 0, 1) },
                });
                let expense = 0;
                expenses.forEach((record) => {
                    const date = new Date(record.date);
                    if (date.getFullYear() === year && date.getMonth() === i) {
                        expense += record.expenseAmount;
                    }
                });
                annualEarning.push({ month: month[i], earning: earning, expense: expense, profit: earning - expense });

            } else {
                const records = await Record.find({
                    date: { $gte: new Date(year, i, 1), $lt: new Date(year, i + 1, 1) },
                });
                let earning = 0;
                records.forEach((record) => {
                    const date = new Date(record.date);
                    if (date.getFullYear() === year && date.getMonth() === i) {
                        earning += record.totalEarnings;
                    }
                });

                const expenses = await Expense.find({
                    date: { $gte: new Date(year, i, 1), $lt: new Date(year, i + 1, 1) },
                });
                let expense = 0;
                expenses.forEach((record) => {
                    const date = new Date(record.date);
                    if (date.getFullYear() === year && date.getMonth() === i) {
                        expense += record.expenseAmount;
                    }
                });

                annualEarning.push({ month: month[i], earning: earning, expense: expense, profit: earning - expense });
            }
        } catch (err) {
            return res.status(500).send("Error getting annual profit.");
        }
    }

    return res.status(200).send(annualEarning);


});

export default router;