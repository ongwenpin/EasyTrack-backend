import { Router } from "express";
import { Record } from "../models/recordModel.js";
import { verifyToken } from "../middleware.js";
import dotenv from "dotenv";
import multer from "multer";
import { uploadFile, generatePresignedUrl, deleteFile } from "../utils/s3_functions.js";
import { v4 as uuidv4 } from 'uuid';
import { User } from "../models/userModel.js";
import { Notification } from "../models/notificationModel.js";

const router = Router();

dotenv.config();

    
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const BUCKET_NAME = "easytrack-records";

// GET a record
router.get("/api/records/:id", verifyToken, async (req, res) => {
    const recordId = req.params.id;

    try {
        const record = await Record.findById(recordId);
        const allEarningBreakdowns = record.earningBreakdown;

        const processedEarningBreakdowns = [];

        for (let i = 0; i < allEarningBreakdowns.length; i++) {
            const earningBreakdown = allEarningBreakdowns[i];
            const key = earningBreakdown.supportingImage;

            if (key) {
                try {
                    const url = await generatePresignedUrl(key, BUCKET_NAME);
                    earningBreakdown.supportingImage = url;
    
                    processedEarningBreakdowns.push({
                        name: earningBreakdown.name,
                        amount: earningBreakdown.amount,
                        supportingImageName: earningBreakdown.supportingImageName,
                        supportingImageURL: url,
                        supportingImage: "",
                        supportingImageKey: key
                    });
    
                } catch (err) {
                    return res.status(500).send("Internal Server Error: Failed to generate presigned URL for image");
                }

            } else {
                processedEarningBreakdowns.push({
                    name: earningBreakdown.name,
                    amount: earningBreakdown.amount,
                    supportingImageName: "",
                    supportingImageURL: "",
                    supportingImage: "",
                    supportingImageKey: ""
                });
            }
            
        }

        const processedRecord = { ...record._doc, earningBreakdown: processedEarningBreakdowns };
        return res.status(200).send(processedRecord);
    } catch (err) {
        return res.status(400).send(err.message);
    }
});

// GET all records
router.get("/api/records", verifyToken, async (req, res) => {
    try {
        const records = await Record.find();

        const processedRecords = [];
        
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const allEarningBreakdowns = record.earningBreakdown;

            const processedEarningBreakdowns = [];

            for (let j = 0; j < allEarningBreakdowns.length; j++) {
                const earningBreakdown = allEarningBreakdowns[j];
                const key = earningBreakdown.supportingImage;

                if (key) {
                    try {
                        const url = await generatePresignedUrl(key, BUCKET_NAME);
                        earningBreakdown.supportingImage = url;
    
                        processedEarningBreakdowns.push({
                            name: earningBreakdown.name,
                            amount: earningBreakdown.amount,
                            supportingImageName: earningBreakdown.supportingImageName,
                            supportingImageURL: url,
                            supportingImage: "",
                            supportingImageKey: key
                        });
    
                    } catch (err) {
                        return res.status(500).send("Internal Server Error: Failed to generate presigned URL for image");
                    }

                } else {
                    processedEarningBreakdowns.push({
                        name: earningBreakdown.name,
                        amount: earningBreakdown.amount,
                        supportingImageName: "",
                        supportingImageURL: "",
                        supportingImage: "",
                        supportingImageKey: ""
                    });
                }
                
            }

            const processedRecord = { ...record._doc, earningBreakdown: processedEarningBreakdowns };
            processedRecords.push(processedRecord);
        }

        return res.status(200).send(processedRecords);
    } catch (err) {
        return res.status(400).send(err.message);
    }
});

// POST a record
router.post("/api/records", verifyToken, upload.any(), async (req, res) => {

    const recordData = req.body;
    const recordFiles = req.files;
    const earningBreakdownLength = recordData.earningBreakdownLength;
    const allEarningBreakdowns = [];

    for (let i = 0; i < earningBreakdownLength; i++) {

        const recordFile = recordFiles.filter((file) => file.fieldname === `earningBreakdown-supportingImage-${i}`)[0];

        if (recordFile) {
            const key = uuidv4() + "-" + recordFile.originalname;
            await uploadFile(recordFile, key, BUCKET_NAME).then((result) => {
                if (result === "File uploaded successfully") {  
                    const newEarningBreakdown = {
                        name: recordData[`earningBreakdown-name-${i}`],
                        amount: recordData[`earningBreakdown-amount-${i}`],
                        supportingImageName: recordFile.originalname,
                        supportingImage: key
                    }
                    allEarningBreakdowns.push(newEarningBreakdown);
                } else {
                    return res.status(500).send("Internal Server Error: Failed to upload image to s3 bucket");
                }
            });    
        } else {
            const newEarningBreakdown = {
                name: recordData[`earningBreakdown-name-${i}`],
                amount: recordData[`earningBreakdown-amount-${i}`],
            }
            allEarningBreakdowns.push(newEarningBreakdown);
        }

    }

    const newRecord = new Record({
        username: recordData.username,
        date: recordData.date,
        branch: recordData.branch,
        totalEarnings: recordData.totalEarnings,
        earningBreakdown: allEarningBreakdowns
    });

    try {
        const record = await newRecord.save();
        
        try {
            const users = await User.find({role: "admin"});
            const notifications = users.map((user) => {
                return new Notification({
                    username: user.username,
                    message: `New record created by ${recordData.username} for ${recordData.date} at ${recordData.branch} branch.`,
                    date: new Date(),
                    isRead: false
                });
            });

            await Notification.insertMany(notifications);

        } catch (err) {
            return res.status(500).send("Internal Server Error: Failed to create notifications for admins");
        }
        
        return res.status(201).send(record);
    } catch (err) {
        return res.status(400).send(err.message);
    }

});

// DELETE a record
router.delete("/api/records/:id", verifyToken, async (req, res) => {
    const recordId = req.params.id;

    try {
        const record = await Record.findById(recordId);
        const allEarningBreakdowns = record.earningBreakdown;

        const response = await Promise.all(allEarningBreakdowns.map(async (earningBreakdown) => {
            const key = earningBreakdown.supportingImage;
            if (key) {
                return deleteFile(key, BUCKET_NAME).then((result) => {
                    if (result === "File deleted successfully") {
                        return;
                    } else {
                        return res.status(500).send("Internal Server Error: Failed to delete image from s3 bucket");
                    }
                }).catch((err) => {
                    return res.status(500).send("Internal Server Error: Failed to delete image from s3 bucket");
                });
            } else {
                return;
            }
            
        }));

        const deletedRecord = await Record.findByIdAndDelete(recordId);
        return res.status(200).send("Record deleted successfully");
    } catch (err) {
        return res.status(400).send(err.message);
    }
});

// PATCH a record
router.patch("/api/records/:id", verifyToken, upload.any(), async (req, res) => {
    const recordId = req.params.id;
    const recordData = req.body;
    const recordFiles = req.files;
    const earningBreakdownLength = recordData.earningBreakdownLength;

    const allEarningBreakdowns = [];

    const prevRecord = await Record.findById(recordId);

    for (let i = 0; i < earningBreakdownLength; i++) {
        const supportingImageKey = recordData[`earningBreakdown-supportingImageKey-${i}`];

        // Supporting image did not changed
        if (supportingImageKey) {
            const newEarningBreakdown = {
                name: recordData[`earningBreakdown-name-${i}`],
                amount: recordData[`earningBreakdown-amount-${i}`],
                supportingImageName: recordData[`earningBreakdown-supportingImageName-${i}`],
                supportingImage: supportingImageKey
            }
            allEarningBreakdowns.push(newEarningBreakdown);
        } else {
            const recordFile = recordFiles.filter((file) => file.fieldname === `earningBreakdown-supportingImage-${i}`)[0];
            if (recordFile) {
                const key = uuidv4() + "-" + recordFile.originalname;
                await uploadFile(recordFile, key, BUCKET_NAME).then((result) => {
                    if (result === "File uploaded successfully") {  
                        const newEarningBreakdown = {
                            name: recordData[`earningBreakdown-name-${i}`],
                            amount: recordData[`earningBreakdown-amount-${i}`],
                            supportingImageName: recordFile.originalname,
                            supportingImage: key
                        }
                        allEarningBreakdowns.push(newEarningBreakdown);
                    } else {
                        return res.status(500).send("Internal Server Error: Failed to upload image to s3 bucket");
                    }
                });

            } else {
                const newEarningBreakdown = {
                    name: recordData[`earningBreakdown-name-${i}`],
                    amount: recordData[`earningBreakdown-amount-${i}`],
                }
                allEarningBreakdowns.push(newEarningBreakdown);
            }
        }
    }

    const updatedRecord = {
        username: recordData.username,
        date: recordData.date,
        branch: recordData.branch,
        totalEarnings: recordData.totalEarnings,
        earningBreakdown: allEarningBreakdowns,
        remarks: recordData.remarks
    }

    // Clean up the previous images from s3 bucket if they exist
    const currentSupportingImageKeys = allEarningBreakdowns
        .map((earningBreakdown) => earningBreakdown.supportingImage)
        .filter((key) => key);
    

    for (let i = 0; i < prevRecord.earningBreakdown.length; i++) {
        const prevKey = prevRecord.earningBreakdown[i].supportingImage;
        
        if (prevKey && !currentSupportingImageKeys.includes(prevKey)) {
            console.log(`Deleting ${prevKey} from s3 bucket`);
            await deleteFile(prevKey, BUCKET_NAME).then((result) => {
                if (result === "File deleted successfully") {
                    return;
                } else {
                    return res.status(500).send("Internal Server Error: Failed to delete image from s3 bucket for clean up");
                }
            }).catch((err) => {
                return res.status(500).send("Internal Server Error: Failed to delete image from s3 bucket for clean up");
            });
        }
        
        
    }
    

    try {
        const record = await Record.findOneAndUpdate({ _id: recordId }, updatedRecord, { new: true });
        return res.status(200).send(record);
    } catch (err) {
        return res.status(400).send(err.message);
    }

});


export default router;