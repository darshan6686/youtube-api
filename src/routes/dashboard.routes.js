import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    getChannelVideo,
    getVideoStats
} from "../controllers/dashboard.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/videostats").get(getVideoStats)
router.route("/channel-videos").get(getChannelVideo)

export default router