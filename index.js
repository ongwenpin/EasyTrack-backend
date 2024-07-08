import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import userRouter from "./routes/users.route.js";
import authRouter from "./routes/auth.route.js";
import recordRouter from "./routes/records.route.js";
import analyticsRouter from "./routes/analytics.route.js";
import searchRouter from "./routes/search.route.js";
import cookieParser from "cookie-parser";
import "./strategies/local-strategy.js";



dotenv.config();

const app = express();

const PORT = 5050;
const MONGO_URL = process.env.ATLAS_URL;

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};

app.use(express.json());

app.use(cors(corsOptions));

app.use(cookieParser());

app.use(userRouter);
app.use(authRouter);
app.use(recordRouter);
app.use(analyticsRouter);
app.use(searchRouter);

// start the Express server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

mongoose
.connect(MONGO_URL)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {console.log(err);});

