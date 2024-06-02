import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import userRouter from "./routes/users.route.js";
import authRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import "./strategies/local-strategy.js";


dotenv.config();

const app = express();

const PORT = process.env.PORT;
const MONGO_URL = process.env.ATLAS_URL;

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};

app.use(express.json());

app.use(cors(corsOptions));

app.use(cookieParser());

// app.use(session({
//     secret:"EasyTrackSecretKey",
//     saveUninitialized: false,
//     resave: false,
//     cookie: {
//         maxAge: 1000 * 60 * 60,
//     }
// }));

// app.use(passport.initialize());
// app.use(passport.session());

app.use(userRouter);
app.use(authRouter);

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

