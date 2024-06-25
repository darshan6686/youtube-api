import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";


const createPlaylist = asyncHandler(async(req,res) => {
    const {name, description} = req.body

    if (!(name || description)) {
        throw new ApiError(400, "All field are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "playlist created successfully"
        )
    )
})


const getUserPlaylist = asyncHandler(async(req,res) => {
    const {userId} = req.params

    if (!userId) {
        throw new ApiError(400, "userId is missing")
    }

    const playlist = await Playlist.find({
        owner: userId
    })

    if (!playlist) {
        throw new ApiError(400, "playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "playlist feteched successfully"
        )
    )
})


const getPlaylisttById = asyncHandler(async(req,res) => {
    const {playlistId} = req.params

    if (!playlistId) {
        throw new ApiError(400, "playlistId is missing")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            owner: 1,
                            title: 1,
                            description: 1,
                            thumbnail: 1,
                            videoFile: 1,
                            duration: 1
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "playlist feteched successfully"
        )
    )
})


const updatePlaylist = asyncHandler(async(req,res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!playlistId) {
        throw new ApiError("playlistId is missing")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "playlist updated successfully"
        )
    )
})


const deletePlaylist = asyncHandler(async(req,res) => {
    const {playlistId} = req.params

    if (!playlistId) {
        throw new ApiError(400, "playlistId is missing")
    }

    const playlist = await Playlist.findByIdAndDelete(
        playlistId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "playlist deleted successfully"
        )
    )
})


const addVideoInPlaylist = asyncHandler(async(req,res) => {
    const {playlistId, videoId} = req.params

    if (!(playlistId || videoId)) {
        throw new ApiError(400, "playlistId or videoId is missing")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "playlist is not found")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "video not found")
    }

    const alreadyVideo = playlist.videos.includes(videoId)

    if (alreadyVideo) {
        throw new ApiError(400, "video is alreday added in this playlist")
    }

    playlist.videos.push(videoId)
    await playlist.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "video added in playlist successfully"
        )
    )
})


const removeVideoFromPlaylist = asyncHandler(async(req,res) => {
    const {playlistId, videoId} = req.params

    if (!(playlistId || videoId)) {
        throw new ApiError(400, "playlistId or videoId is missing")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "playlist not found")
    }


    const indexOfVideo = playlist.videos.indexOf(videoId)

    if (indexOfVideo === -1) {
        throw new ApiError(400, "video not found in this playlist")
    }

    playlist.videos.splice(videoId,1)
    await playlist.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "video removed successfully for this playlist"
        )
    )
})


export {
    createPlaylist,
    getUserPlaylist,
    getPlaylisttById,
    updatePlaylist,
    deletePlaylist,
    addVideoInPlaylist,
    removeVideoFromPlaylist
}