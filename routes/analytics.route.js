import { Router } from "express";
import { Record } from "../models/recordModel.js";
import dotenv from "dotenv";
import { verifyToken } from "../middleware.js";

const router = Router();

dotenv.config();

router.get("/api/analytics/dailyprofit", verifyToken, async (req, res) => {
    const date = new Date();
    const records = await Record.find({
        date: date.toISOString().slice(0, 10),
    });
    let profit = 0;
    records.forEach((record) => {
        profit += record.totalEarnings;
    });

    return res.status(200).send({ date: date.toISOString().slice(0, 10), profit: profit });
})


router.get("/api/analytics/weeklyprofit", verifyToken, async (req, res) => {

    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    const startDate = new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000));
    const startDay = startDate.getDay();
    const weeklyProfit = [];

    const distinctBranches = await Record.distinct("branch");

    for (let i = 0; i < 7; i++) {
        try {
            const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
            const dayName = day[(startDay + i - 1) % 7];
            const records = await Record.find({
                date: date.toISOString().slice(0, 10),
            });
            let branchProfits = {day: dayName, profit: 0};

            for (let branch of distinctBranches) {
                branchProfits[branch] = 0;
            }

            records.forEach((record) => {
                const branch = record.branch;
                const earnings = record.totalEarnings;
                
                if (!branchProfits[branch]) {
                    branchProfits[branch] = 0;
                }
                
                branchProfits[branch] += earnings;
                branchProfits.profit += earnings;
            });

            weeklyProfit.push(branchProfits);
        } catch (err) {
            return res.status(500).send("Error getting weekly profit.");
        }
    }


    return res.status(200).send(weeklyProfit);
    
});

router.get("/api/analytics/annualprofit", verifyToken, async (req, res) => {

    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const year = new Date().getFullYear();

    const annualProfit = [];

    for (let i = 0; i < 12; i++) {

        try {
            // Find all record within that month and year
            if (i === 11) {
                const records = await Record.find({
                    date: { $gte: new Date(year, i, 1), $lt: new Date(year + 1, 0, 1) },
                });
                let profit = 0;
                records.forEach((record) => {
                    const date = new Date(record.date);
                    if (date.getFullYear() === year && date.getMonth() === i) {
                        profit += record.totalEarnings;
                    }
                });
                annualProfit.push({ month: month[i], profit: profit });

            } else {
                const records = await Record.find({
                    date: { $gte: new Date(year, i, 1), $lt: new Date(year, i + 1, 1) },
                });
                let profit = 0;
                records.forEach((record) => {
                    const date = new Date(record.date);
                    if (date.getFullYear() === year && date.getMonth() === i) {
                        profit += record.totalEarnings;
                    }
                });
                annualProfit.push({ month: month[i], profit: profit });
            }
        } catch (err) {
            return res.status(500).send("Error getting annual profit.");
        }
    }

    return res.status(200).send(annualProfit);


});



export default router;