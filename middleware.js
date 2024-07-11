import jwt from "jsonwebtoken";
import { UserAuth } from "./models/userAuthModel.js";

export const verifyToken =  (req, res, next) => {
    const getToken = req.cookies.access_token;
    // Verify token
    jwt.verify(getToken, process.env.JWT_SECRET, async (err, success) => {
        if (err) {
            if (req.cookies.refresh_token) {
                return res.status(401).send("Access token expired");
            }
            return res.status(401).send("Unauthorized, Please Log in first");
        }

        const {access_id, id} = success;

        const auth = await UserAuth.findOne({accessToken: access_id, userID: id})

        if (!auth) {
            return res.status(401).send("Unauthorized");
        }
        next();
    });
};
