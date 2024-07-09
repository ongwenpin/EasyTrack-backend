import { Router } from "express";
import bcryptjs from "bcryptjs";
import { User } from "../models/userModel.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { UserVerification } from "../models/userVerificationModel.js";
import { generateNewVerificationCode } from "../utils/verification.js";

const router = Router();

dotenv.config();

// Verify a user
router.post("/api/verify/:verify_key", async (req, res) => {
    const {verify_key} = req.params;
    const {username} = req.body;
    
    try {
        const userVerification = await UserVerification.findOne({username: username, verificationCode: verify_key});

        if (!userVerification) {
            return res.status(404).send("Invalid verification code");
        }

        // Check if verification code is expired
        if ( userVerification.expiry < Date.now()) {
            const currUser = await User.findOne({username: username});
            generateNewVerificationCode(currUser);
            return res.status(400).send("Verification code expired");
        }

        // Update user verified status to true
        const deletedUserVerification = await UserVerification.findOneAndDelete({username: username, verificationCode: verify_key});

        const changeUserVerifiedStatus = await User.findOneAndUpdate({username: userVerification.username}, {verified: true}, {new: true});

        return res.status(200).send("User verified successfully");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Invalid verification attempt");
    }
});

// Authenticate a user login
router.post("/api/auth", async (req, res) => {
    
    try {
        const {username, password} = req.body;
        const validUser = await User.findOne({username: username});
        if (!validUser) {
            return res.status(404).json({message:"User not found"});
        }
        const validPassword = bcryptjs.compareSync(password, validUser.password);
        if (!validPassword) {
            return res.status(401).json({message:"Wrong credentials"});
        }
        const token = jwt.sign({id: validUser._id}, process.env.JWT_SECRET);
        const {password: userPassword, ...userData} = validUser.toObject();
        return res.cookie('access_token', token, {httpOnly: true, maxAge: 1000 * 60 * 60 * 2, sameSite: "strict"}).status(200).send(userData);

    } catch (err) {
        return res.status(500).send(err.message);
    }

}
);

// Log out a user
router.get("/api/logout", async (req, res) => {
    res.clearCookie('access_token');
    return res.status(200).send("Successfully logged out");
});

router.get("/api/auth/status", async (req, res) => {
    const getToken = req.cookies.access_token;
    // Verify token
    jwt.verify(getToken, process.env.JWT_SECRET, (err, success) => {
        if (err) {
            return res.status(401).send("Unauthorized");
        }
        return res.status(200).send("Authorized");
    });

});

export default router;