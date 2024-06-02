import dotenv from "dotenv";
import { UserVerification } from "../models/userVerificationModel.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

dotenv.config();

// Generate a new verification code
export async function generateNewVerificationCode(userData) {

    const verificationCode = crypto.randomBytes(16).toString('hex');
    const newUserVerification = new UserVerification({username: userData.username, verificationCode: verificationCode, expiry: Date.now() + 1000 * 60 * 60});
    try {
        // Delete any existing verification code for the user
        await UserVerification.findOneAndDelete({username: userData.username});

        await newUserVerification.save();

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    
        transporter.sendMail({
            to: userData.email,
            subject: "EasyTrack Account Verification",
            text: `Click on the link to verify your account: http://localhost:5173/verify/${verificationCode}`,
        })
            .then(() => console.log("Email sent successfully"))
            .catch((err) => console.log(err));

    } catch (err) {
        console.log(err);
        return;
    }
    
}