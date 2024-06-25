import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    addComment,
    deleteComment,
    getVideoComment,
    updateComment
} from "../controllers/comment.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/add-comment/:videoId").post(addComment)
router.route("/comments/:videoId").get(getVideoComment)
router.route("/update-comment/:commentId").patch(updateComment)
router.route("/delete-comment/:commentId").delete(deleteComment)

export default router