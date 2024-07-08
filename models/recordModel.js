import { Schema } from "mongoose";
import mongoose from "mongoose";

const EarningBreakdownSchema = new Schema({
    name: {
        type: Schema.Types.String,
        required: true
    },
    amount: {
        type: Schema.Types.Number,
        required: true
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

const RecordSchema = new Schema({
    username: {
        type: Schema.Types.String,
        required: true
    },
    date: {
        type: Schema.Types.Date,
        required: true
    },
    branch: {
        type: Schema.Types.String,
        required: true
    },
    totalEarnings: {
        type: Schema.Types.Number,
        required: true
    },
    earningBreakdown: [EarningBreakdownSchema],
    remarks: {
        type: Schema.Types.String,
        required: false,
        default: ""
    }

});

RecordSchema.index({ username: 'text', branch: 'text' });

export { EarningBreakdownSchema }
export const Record = mongoose.model('Record', RecordSchema, 'records');