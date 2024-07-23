import { Schema } from "mongoose";
import mongoose from "mongoose";

const UserAuthSchema = new Schema({
    username: {
        type: Schema.Types.String,
        required: true,
        unique: true
    },
    password: {
        type: Schema.Types.String,
        required: true
    },
    refreshToken: {
        type: Schema.Types.String,
        required: false,
        default: ""
    },
    accessToken: {
        type: Schema.Types.String,
        required: false,
        default: ""
    },
    userID: {
        type: Schema.Types.ObjectId,
        required: true
    },
    role: {
        type: Schema.Types.String,
        default: 'user',
        required: true
    },

});

export const UserAuth = mongoose.model('UserAuth', UserAuthSchema, 'userAuths');