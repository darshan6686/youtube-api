import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    getLikedVideo,
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike
} from "../controllers/like.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/like-video/:videoId").post(toggleVideoLike)
router.route("/like-comment/:commentId").post(toggleCommentLike)
router.route("/like-tweet/:tweetId").post(toggleTweetLike)
router.route("/liked-videos").get(getLikedVideo)

export default router