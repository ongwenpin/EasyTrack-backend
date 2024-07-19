import mongoose from 'mongoose';
import { Schema } from "mongoose";

const expenseSchema = new Schema({

    expenseName: {
        type: Schema.Types.String,
        required: true
    },
    expenseAmount: {
        type: Schema.Types.Number,
        required: true
    },
    username: {
        type: Schema.Types.String,
        required: true
    },
    branch: {
        type: Schema.Types.String,
        required: true
    },
    date: {
        type: Schema.Types.Date,
        required: true
    },
    remarks: {
        type: Schema.Types.String,
        required: false,
        default: ""
    },
    supportingImageName: {
        type: Schema.Types.String,
        required: false,
        default: ""
    },
    supportingImage: {
        type: Schema.Types.String,
        required: false,
        default: ""
    }

});

export const Expense = mongoose.model('Expense', expenseSchema, 'expenses');