import { Router } from "express";
import { User } from "../models/userModel.js";
import bcryptjs from "bcryptjs";
import { verifyToken } from "../middleware.js";
import { generateNewVerificationCode } from "../utils/verification.js";
import dotenv from "dotenv";

const router = Router();

dotenv.config();

// GET all users
router.get("/api/users", verifyToken, async (req, res) => {
    try {
        const users = await User.find();
        return res.status(200).send(users);

    } catch (err) {
        return res.status(400).send(err.message);
    }
});

// Get a user by their username
router.get("/api/users/:username", verifyToken, async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({username: username});
        return res.status(200).send(user);

    } catch {
        return res.status(400).send(err.message);
    }
});

// Sign up a user
router.post("/api/signup", async (req, res) => {
    
    const userData = req.body;
    const hashedPassword = bcryptjs.hashSync(userData.password, 10);
    const newUser = new User({...userData, password: hashedPassword});
    try {
        await newUser.save();
        await generateNewVerificationCode(userData);
        return res.status(201).send({message: "User created successfully"});
    } catch (err) {
        return res.status(400).send(err.message);
    }

});

// POST a user
router.post("/api/users", verifyToken, async (req, res) => {
    const userData = req.body;
    const hashedPassword = bcryptjs.hashSync(userData.password, 10);
    const newUser = new User({...userData, password: hashedPassword});
    try {
        await newUser.save();
        await generateNewVerificationCode(userData);
        return res.status(201).send({message: "User created successfully"});
    } catch (err) {
        return res.status(400).send(err.message);
    }
});

// PATCH a user
router.patch("/api/users/:username", verifyToken, async (req, res) => {
    try {
        const username = req.params.username;
        const updatedUser = await User.findOneAndUpdate({username: username}, req.body, {new: true});
        const {password, ...user} = updatedUser.toObject();
        return res.status(200).send(user);
    } catch (err) {
        return res.status(400).send(err.message);
    }
});

// DELETE a user
router.delete("/api/users/:username", verifyToken, async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOneAndDelete({username: username});
        return res.status(200).send("User deleted successfully");
    } catch (err) {
        return res.status(400).send(err.message);
    }
});

export default router;