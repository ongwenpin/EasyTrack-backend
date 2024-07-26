import { Router } from "express";
import { Record } from "../models/recordModel.js";
import { User } from "../models/userModel.js";
import dotenv from "dotenv";
import { verifyToken } from "../middlewares/authentication.js";

const router = Router();

dotenv.config();

router.get("/api/search", verifyToken, async (req, res) => {
    const query = req.query.query;

    const result = {};

    if (!query) {
        return res.status(400).send("There is an error in your query");
    }

    const records = await Record.find({
        $text: { $search: query },
    });

    const users = await User.find({
        $text: { $search: query },
    });

    result.records = records;
    result.users = users;

    return res.status(200).send(result);

});

export default router;