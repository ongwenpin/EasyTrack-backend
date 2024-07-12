import { Router } from "express";
import dotenv from "dotenv";
import { Notification } from "../models/notificationModel.js";

const router = Router();

dotenv.config();

// GET all notifications for a user
router.get('/api/notification/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const notifications = await Notification.find({ username: username });
        return res.status(200).send(notifications);
    } catch (error) {
        return res.status(500).send("Error getting notifications for user");
    }

});

// Remove a notification
// router.delete('/api/notification/:id', async (req, res) => {
//     const id = req.params.id;

//     try {
//         const notification = await Notification.findByIdAndDelete(id);
//         return res.status(200).send(`Notification ${id} deleted`);
//     } catch (error) {
//         return res.status(500).send("Error deleting notification");
//     }

// });

// Remove all notifications for a user
router.delete('/api/notification/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const notifications = await Notification.deleteMany({ username: username });
        return res.status(200).send("Notifications deleted");
    } catch (error) {
        return res.status(500).send("Error deleting notifications for user");
    }

});

// PATCH a notification
router.patch('/api/notification/:id', async (req, res) => {
    const id = req.params.id;
    const notification = req.body;

    try {
        const updatedNotification = await Notification.findByIdAndUpdate(id, notification, { new: true });
        return res.status(200).send(updatedNotification);
    } catch (error) {
        return res.status(500).send("Error updating notification");
    }

});

export default router;