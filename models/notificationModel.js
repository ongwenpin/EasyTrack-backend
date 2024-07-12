import { Schema } from "mongoose";
import mongoose from "mongoose";

const notificationSchema = new Schema({
    username: {
        type: Schema.Types.String,
        required: true
    },
    message: {
        type: Schema.Types.String,
        required: true
    },
    date: {
        type: Schema.Types.Date,
        required: true
    },
    isRead: {
        type: Schema.Types.Boolean,
        required: true,
        default: false
    }
});

export const Notification = mongoose.model('Notification', notificationSchema, 'notifications');