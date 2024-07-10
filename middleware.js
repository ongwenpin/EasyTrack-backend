import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const getToken = req.cookies.access_token;
    // Verify token
    jwt.verify(getToken, process.env.JWT_SECRET, (err, success) => {
        if (err) {
            if (req.cookies.refresh_token) {
                return res.status(401).send("Access token expired");
            }
            return res.status(401).send("Unauthorized, Please Log in first");
        }
        next();
    });
};
