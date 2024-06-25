import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    getSubscriberChannel,
    getUserChannelSubscribers,
    toggleSubscription
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT)

router.route("/subscribe-channel/:channelId").post(toggleSubscription)
router.route("/channel-subscribe/:channelId").post(getUserChannelSubscribers)
router.route("/subscribed-channel").post(getSubscriberChannel)

export default router