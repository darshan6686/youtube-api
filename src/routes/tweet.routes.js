import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    createTweet,
    deleteTweet,
    getUserTweet,
    updateTweet
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT)

router.route("/create-tweet").post(createTweet)
router.route("/tweets/:userId").get(getUserTweet)
router.route("/update-tweet/:tweetId").patch(updateTweet)
router.route("/delete-tweet/:tweetId").delete(deleteTweet)

export default router