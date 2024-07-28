import mongoose from "mongoose";
import { Schema } from "mongoose";

const BranchSchema = new Schema({
    branchName: {
        type: Schema.Types.String,
        required: true,
        unique: true
    },
});

export const Branch = mongoose.model("Branch", BranchSchema, "Branches");
