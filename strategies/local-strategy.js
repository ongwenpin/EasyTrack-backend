import passport from "passport";
import { Strategy } from "passport-local";
import { User } from "../models/userModel.js";

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.username);
});

// Deserialize user
passport.deserializeUser((username, done) => {
    try {
        const user = User.findOne({username: username});
        if (!user) {
            throw new Error("User not found");
        }
        done(null, user);
    
    } catch (error) {
        done(error, null);
    }
});

export default passport.use(new Strategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({username: username});
            if (!user) {
                throw new Error("User not found");
            }

            if (user.password === password) {
                done(null, user);
            } else {
                throw new Error("Incorrect password");
            }

        } catch (error) {
            done(error, null);
        }
    }
));