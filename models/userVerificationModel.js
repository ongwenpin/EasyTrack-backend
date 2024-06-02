import { Schema } from "mongoose";
import mongoose from "mongoose";

const userVerificationSchema = new Schema({
    username: {
        type: Schema.Types.String,
        required: true,
        unique: true
    },
    verificationCode: {
        type: Schema.Types.String,
        required: true
    },
    expiry: {
        type: Schema.Types.Date,
        required: true
    }
});

export const UserVerification = mongoose.model('UserVerification', userVerificationSchema, 'userVerification');