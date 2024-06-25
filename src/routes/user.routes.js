import { Router } from "express";
import { 
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistroy,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    removeVideoFromWatchHistroy,
    updateAccountDetails,
    updateUserAvtar,
    updateUserCoverImage
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

// secure route
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/get-profile").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router
    .route("/avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvtar)
    
router
    .route("/cover-image")
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/histroy").get(verifyJWT, getWatchHistroy)
router.route("/remove-video-histroy/:videoId").delete(verifyJWT, removeVideoFromWatchHistroy)

export default router