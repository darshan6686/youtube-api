import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";


const publishVideo = asyncHandler( async (req,res) => {
    const { title, description } = req.body

    if (!(title || description)) {
        throw new ApiError(401, "All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path

    if(!(videoFileLocalPath || thumbnailLocalPath)){
        throw new ApiError(400, "video and thumbnail are required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!(videoFile || thumbnail)){
        throw new ApiError(400, "video and thumbnail are required")
    }

    // console.log(videoFile);
    // console.log(thumbnail);

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        title,
        description,
        duration: videoFile.duration
    })

    if (!video) {
        throw new ApiError(500, "Something wrong upload to video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "video published succesfully"
        )
    )
})


const getVideoById = asyncHandler( async (req,res) => {
    const {videoId} = req.params

    if (!videoId) {
        throw new ApiError(400, "video id is missing")
    }

    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: {
                views: 1
            }
        },
        {
            new: true
        }
    )

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $push: {
                watchHistroy: videoId
            }
        },
        {
            new: true
        }
    )

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
        },
        {
            $unwind: "$owner"
        }
    ])

    if (!video.length) {
        throw new ApiError(400, "video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "video fetched successfully"
        )
    )
})


const updateVideoDetail = asyncHandler( async (req,res) => {
    const {videoId} = req.params
    const {title, description} = req.body

    if (!videoId) {
        throw new ApiError(400, "video id is missing")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description
            }
        },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "video details updated succesfully"
        )
    )
})


const updateVideoThumbnail = asyncHandler( async (req,res) => {
    const {videoId} = req.params
    
    const oldVideo = await Video.findById(videoId);
    
    if (!oldVideo) {
        throw new ApiError(400, "video is not found")
    }
    const url = oldVideo.thumbnail.split("/")
    const filename = url[url.length - 1]
    const publicId = filename.split(".")[0]
    // console.log(publicId);

    const removeOldThumbnail = await removeOnCloudinary(publicId)

    const thumbnailLocalPath = req.file?.path

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while updating thumbnail")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail.url
            }
        },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "thumbnail updated successfully"
        )
    )
})


const deleteVideo = asyncHandler( async (req,res) => {
    const {videoId} = req.params

    if (!videoId) {
        throw new ApiError(400, "video id is missing")
    }

    const video = await Video.findByIdAndDelete(
        videoId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "video deleted successfully"
        )
    )
})


const togglePublishStatus = asyncHandler( async (req,res) => {
    const {videoId} = req.params

    // console.log(videoId);
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "video not found")
    }

    let publishStatus = video?.isPublished
    // console.log(publish);

    if (!publishStatus) {
        throw new ApiError(400, "video status is missing")
    }

    if (publishStatus === true) {
        publishStatus = false
    }
    else {
        publishStatus = true
    }

    // console.log(publish);

    const newStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: publishStatus
            }
        },
        { new: true }
    )
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newStatus,
            "video status changed successfully"
        )
    )
})


const getAllVideos = asyncHandler( async (req,res) => {
    const { page = 1, limit = 10, query = "", sortBy = 1, sortType = "createdAt", userId } = req.query

    if (!userId) {
        throw new ApiError(400, "userId is missing")
    }

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                isPublished: true,
                // title: { $regex: query, $options: "i" }
            }
        },
        {
            $sort: {
                [sortType]: sortBy === "1" ? 1 : -1
            }
        },
        {
            $skip: parseInt(page - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "videos fetched successfully"
        )
    )
})


export {
    publishVideo,
    getVideoById,
    updateVideoDetail,
    updateVideoThumbnail,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
}