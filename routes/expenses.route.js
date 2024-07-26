import e, { Router } from "express";
import { Expense } from "../models/expenseModel.js";
import { uploadFile, generatePresignedUrl, deleteFile } from "../utils/s3_functions.js";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import dotenv from "dotenv";
import { verifyToken } from "../middlewares/authentication.js";

const router = Router();

dotenv.config();

const BUCKET_NAME = "easytrack-expenses";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET all expenses
router.get("/api/expenses", verifyToken, async (req, res) => {
    try {
        const expenses = await Expense.find();
        const processedExpenses = []

        for (let i = 0; i < expenses.length; i++) {
            const expense = expenses[i];
            const key = expense.supportingImage;

            if (key) {
                try {
                    const url = await generatePresignedUrl(key, BUCKET_NAME);
                    const processedExpense = {
                        expenseName: expense.expenseName,
                        expenseAmount: expense.expenseAmount,
                        username: expense.username,
                        branch: expense.branch,
                        date: expense.date,
                        remarks: expense.remarks,
                        supportingImageName: expense.supportingImageName,
                        //supportingImage: "",
                        supportingImageUrl: url,
                        supportingImageKey: key,
                        _id: expense._id
                    }

                    processedExpenses.push(processedExpense);
                } catch (err) {
                    return res.status(500).send("Internal Server Error: Failed to generate presigned URL for image");
                }
            } else {
                const processedExpense = {
                    expenseName: expense.expenseName,
                    expenseAmount: expense.expenseAmount,
                    username: expense.username,
                    branch: expense.branch,
                    date: expense.date,
                    remarks: expense.remarks,
                    supportingImageName: "",
                    //supportingImage: "",
                    supportingImageUrl: "",
                    supportingImageKey: "",
                    _id: expense._id
                }

                processedExpenses.push(processedExpense);
            }
        }

        return res.status(200).send(processedExpenses);
    } catch (err) {
        return res.status(500).send("Internal Server Error: Failed to fetch expenses");

    }
});

// GET a specific expense
router.get("/api/expenses/:id", verifyToken, async (req, res) => {
    try {
        const expenseId = req.params.id;
        const expense = await Expense.findById(expenseId);

        const key = expense.supportingImage;

            if (key) {
                try {
                    const url = await generatePresignedUrl(key, BUCKET_NAME);
                    const processedExpense = {
                        expenseName: expense.expenseName,
                        expenseAmount: expense.expenseAmount,
                        username: expense.username,
                        branch: expense.branch,
                        date: expense.date,
                        remarks: expense.remarks,
                        supportingImageName: expense.supportingImageName,
                        //supportingImage: "",
                        supportingImageUrl: url,
                        supportingImageKey: key,
                        _id: expense._id
                    }
                    return res.status(200).send(processedExpense);

                } catch (err) {
                    return res.status(500).send("Internal Server Error: Failed to generate presigned URL for image");
                }
            } else {
                const processedExpense = {
                    expenseName: expense.expenseName,
                    expenseAmount: expense.expenseAmount,
                    username: expense.username,
                    branch: expense.branch,
                    date: expense.date,
                    remarks: expense.remarks,
                    supportingImageName: "",
                    //supportingImage: "",
                    supportingImageUrl: "",
                    supportingImageKey: "",
                    _id: expense._id
                }
                return res.status(200).send(processedExpense);

            }

        
    } catch (err) {
        return res.status(500).send("Internal Server Error: Failed to fetch expenses");

    }
});


// POST a new expense
router.post("/api/expenses", verifyToken, upload.single("supportingImage"), async (req, res) => {
    const expenseData = req.body;
    const file = req.file;

    var supportingImage = "";
    var supportingImageName = "";

    if (file) {
        const key = uuidv4() + "-" + file.originalname;
        await uploadFile(file, key, BUCKET_NAME).then((result) => {
            if (result === "File uploaded successfully") {
                supportingImage = key;
                supportingImageName = file.originalname;
            } else {
                return res.status(500).send("Internal Server Error: Failed to upload file");
            }
        });

    }

    const newExpense = new Expense({
        expenseName: expenseData.expenseName,
        expenseAmount: expenseData.expenseAmount,
        username: expenseData.username,
        branch: expenseData.branch,
        date: expenseData.date,
        remarks: expenseData.remarks,
        supportingImageName: supportingImageName,
        supportingImage: supportingImage
    });

    try {
        const expense = await newExpense.save();
        return res.status(201).send(expense);
    } catch (err) {
        return res.status(500).send(err);
    }

});

// PATCH a specific expense
router.patch("/api/expenses/:id", verifyToken, upload.single("supportingImage"), async (req, res) => {
    const expenseData = req.body;
    const file = req.file;

    const prevExpense = await Expense.findById(req.params.id); 

    var supportingImage = prevExpense.supportingImage;
    var supportingImageName = prevExpense.supportingImageName;

    // Delete the old file if a new file is uploaded or if the file is removed
    if (!expenseData.supportingImageKey && prevExpense.supportingImage) {
        await deleteFile(prevExpense.supportingImage, BUCKET_NAME).then((result) => {
            if (result !== "File deleted successfully") {
                return res.status(500).send("Internal Server Error: Failed to delete file");
            } else {
                supportingImage = "";
                supportingImageName = "";
            }
        });

    }

    // If a new file is uploaded, upload the new file
    if (file) {
        const key = uuidv4() + "-" + file.originalname;
        await uploadFile(file, key, BUCKET_NAME).then((result) => {
            if (result === "File uploaded successfully") {
                supportingImage = key;
                supportingImageName = file.originalname;
            } else {
                return res.status(500).send("Internal Server Error: Failed to upload supporting image");
            }
        });

    }

    const updatedExpense = {
        expenseName: expenseData.expenseName,
        expenseAmount: expenseData.expenseAmount,
        username: expenseData.username,
        branch: expenseData.branch,
        date: expenseData.date,
        remarks: expenseData.remarks,
        supportingImageName: supportingImageName,
        supportingImage: supportingImage
    };

    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, updatedExpense, { new: true });
        return res.status(200).send(expense);
    } catch (err) {
        return res.status(500).send("Internal Server Error: Failed to update expense");
    }

});

// DELETE a specific expense
router.delete("/api/expenses/:id", verifyToken, async (req, res) => {
    const expenseId = req.params.id;

    const expense = await Expense.findByIdAndDelete(expenseId);

    if (expense.supportingImage) {
        await deleteFile(expense.supportingImage, BUCKET_NAME).then((result) => {
            if (result === "File deleted successfully") {
                return res.status(200).send("Expense deleted successfully");
            } else {
                return res.status(500).send("Internal Server Error: Failed to delete file");
            }
        });
    } else {
        return res.status(200).send("Expense deleted successfully");
    }

});


export default router;