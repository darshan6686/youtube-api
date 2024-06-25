import { Router } from "express"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { 
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishVideo,
    togglePublishStatus,
    updateVideoDetail,
    updateVideoThumbnail
} from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.use(verifyJWT)

router.route("/publish-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishVideo
)

router.route("/video").get(getAllVideos)
router.route("/v2/:videoId").get(getVideoById)
router.route("/update-video/:videoId").patch(updateVideoDetail)
router.route("/thumbnail/:videoId")
    .patch(upload.single("thumbnail"), updateVideoThumbnail)

router.route("/delete-video/:videoId").post(deleteVideo)

router.route("/videos/:videoId").post(togglePublishStatus)


export default router