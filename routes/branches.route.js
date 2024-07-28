import { Router } from "express";
import { Branch } from "../models/branchModel.js";
import { verifyToken } from "../middlewares/authentication.js";

const router = Router();

router.get("/api/branches", async (req, res) => {
    try {
        const branches = await Branch.find();
        return res.status(200).json(branches);
    } catch (error) {
        return res.status(500).send("Internal Server Error: Cannot get branches");
    }
});

router.post("/api/branches", verifyToken, async (req, res) => {
    try {
        console.log(req.body);
        const newBranch = new Branch(req.body);
        await newBranch.save();
        return res.status(201).json(newBranch);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error: Cannot create branch");
    }
});

router.delete("/api/branches/:branch", verifyToken, async (req, res) => {
    try {
        const branch = await Branch.findOneAndDelete({ branchName: req.params.branch });
        if (!branch) {
            return res.status(404).send("Branch not found");
        }
        return res.status(200).json(branch);
    } catch (error) {
        return res.status(500).send("Internal Server Error: Cannot delete branch");
    }
});

export default router;