import { Router } from "express";
import bcryptjs from "bcryptjs";
import { User } from "../models/userModel.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { UserVerification } from "../models/userVerificationModel.js";
import { generateNewVerificationCode } from "../utils/verification.js";
import crypto from "crypto";
import { UserAuth } from "../models/userAuthModel.js";

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

// Send a new verification code
router.post("/api/verify", async (req, res) => {
    const {username} = req.body;
    try {
        const currUser = await User.findOne({username: username});
        if (currUser.verified) {
            return res.status(404).send("User already verified");
        }
        generateNewVerificationCode(currUser);
        return res.status(200).send("Verification code sent");
    } catch (err) {
        return res.status(500).send("Internal server error: Cannot send verification code");
    }
});

// Authenticate a user login
router.post("/api/auth", async (req, res) => {
    
    try {
        const {username, password} = req.body;
        const validUser = await UserAuth.findOne({username: username});
        if (!validUser) {
            return res.status(404).json({message:"User not found"});
        }
        const validPassword = bcryptjs.compareSync(password, validUser.password);
        if (!validPassword) {
            return res.status(401).json({message:"Wrong credentials"});
        }

        const refresh_token_id = crypto.randomBytes(16).toString('hex');
        
        const userAuth = await UserAuth.findOneAndUpdate({username: validUser.username}, {refreshToken: refresh_token_id}, {new: true});
        const token = jwt.sign({id: userAuth.userID, refresh_id: refresh_token_id}, process.env.JWT_SECRET);
        const userInfo = await User.findOne({_id: validUser.userID});
        res.cookie('refresh_token', token, {httpOnly: true, maxAge: 1000 * 60 * 60 * 24, sameSite: "strict"});
        //res.cookie('refresh_token', token, {httpOnly: true, maxAge: 1000 * 60 * 60 * 24, sameSite: "none", secure: true});
        return res.status(200).send(userInfo);
    } catch (err) {
        return res.status(500).send(err.message);
    }

}
);

// Log out a user
router.post("/api/logout", async (req, res) => {
    const username = req.body.username;
    UserAuth.findOneAndUpdate({username: username}, {accessToken: "", refreshToken: ""}, {new: true})
        .then(() => {
            res.clearCookie('refresh_token');
            res.clearCookie('access_token');
            return res.status(200).send("Successfully logged out");
        
        })
        .catch((err) => {
            return res.status(400).send("Fail to log out");
        });
});

router.get("/api/auth/status", async (req, res) => {
    const getToken = req.cookies.refresh_token;
    // Verify token
    jwt.verify(getToken, process.env.JWT_SECRET, (err, success) => {
        if (err) {
            return res.status(401).send("Unauthorized: No refresh token found");
        }
        return res.status(200).send("Authorized");
    });

});

router.get("/api/auth/access", async (req, res) => {
    const getToken = req.cookies.refresh_token;
    // Verify token
    jwt.verify(getToken, process.env.JWT_SECRET, async (err, success) => {
        if (err) {
            return res.status(401).send("Unauthorized");
        }

        const {refresh_id, id} = success;

        const auth = await UserAuth.findOne({refreshToken: refresh_id, userID: id});
        if (!auth) {
            return res.status(401).send("Unauthorized");
        }

        const access_token_id = crypto.randomBytes(16).toString('hex');

        UserAuth.findOneAndUpdate({userID: id}, {accessToken: access_token_id}, {new: true})
            .then((userAuth) => {
                const token = jwt.sign({access_id: access_token_id, id: userAuth.userID }, process.env.JWT_SECRET);
                res.cookie('access_token', token, {httpOnly: true, maxAge: 1000 * 60 * 60, sameSite: "strict"});
                //res.cookie('access_token', token, {httpOnly: true, maxAge: 1000 * 60 * 60, sameSite: "none", secure: true});
                return res.status(200).send("Access token granted");
            }).
            catch((err) => {
                return res.status(400).send("Fail to create access token");
            });

    });
});

export default router;