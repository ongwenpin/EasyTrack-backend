import { Schema } from "mongoose";
import mongoose from "mongoose";

const UserSchema = new Schema({
    username: {
        type: Schema.Types.String,
        required: true,
        unique: true
    },
    name: {
        type: Schema.Types.String,
        required: true
    },
    email: {
        type: Schema.Types.String,
        required: true,
    },
    password: {
        type: Schema.Types.String,
        required: true
    },
    branch: {
        type: Schema.Types.String,
        required: true
    },
    dateofbirth: {
        type: Schema.Types.Date,
        required: true
    },
    verified: {
        type: Schema.Types.Boolean,
        default: false,
        required: true
    },

});

export const User = mongoose.model('User', UserSchema, 'users');


