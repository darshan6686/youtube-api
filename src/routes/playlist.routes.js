import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    addVideoInPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylisttById,
    getUserPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/create-playlist").post(createPlaylist)
router.route("/user-playlist/:userId").get(getUserPlaylist)
router.route("/playlist/:playlistId").get(getPlaylisttById)

router.route("/update-playlist/:playlistId")
    .patch(updatePlaylist)

router.route("/delete-playlist/:playlistId").post(deletePlaylist)
router.route("/add-video-playlist/:playlistId/:videoId").post(addVideoInPlaylist)
router.route("/remove-video-playlist/:playlistId/:videoId").post(removeVideoFromPlaylist)

export default router