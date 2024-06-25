import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const addComment = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    const {content} = req.body

    if (!videoId) {
        throw new ApiError(400, "videoId is missing")
    }

    if (!content) {
        throw new ApiError(400, "content field is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "video not found")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "comment added successfully"
        )
    )
})


const getVideoComment = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId) {
        throw new ApiError(400, "videoId is missing")
    }

    const comment = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
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
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            videoFile: 1,
                            thumbnail: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
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
            comment,
            "comment fetched successfully"
        )
    )
})


const updateComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params
    const {content} = req.body

    if (!commentId) {
        throw new ApiError(400, "commentId is missing")
    }

    if (!content) {
        throw new ApiError(400, "content field is required")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "comment updated successfully"
        )
    )
})


const deleteComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params

    if (!commentId) {
        throw new ApiError(400, "commentId is missing")
    }

    const comment = await Comment.findByIdAndDelete(
        commentId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "comment deleted successfully"
        )
    )
})


export {
    addComment,
    getVideoComment,
    updateComment,
    deleteComment
}