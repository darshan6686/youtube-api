import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getVideoStats = asyncHandler(async(req,res) => {
    const totalVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ])

    const channel = await Subscription.find({
        channel: req.user?._id
    })

    if (!channel) {
        throw new ApiError(400, "user does not create channel")
    }

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: { $sum: 1 }
            }
        }
    ])

    const totalLikes = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project: {
                totalLikes: { $size: "$likes" }
            }
        }
    ])


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalSubscribers,
                totalLikes
            },
            "channel stats fetched successfully"
        )
    )
})


const getChannelVideo = asyncHandler(async(req,res) => {
    const channel = await Subscription.find({
        channel: req.user?._id
    })

    if (!channel) {
        throw new ApiError(400, "user does not create channel")
    }

    const channelVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
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
                            username: 1,
                            fullname: 1,
                            avatar: 1
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
            channelVideos,
            "channel videos fetched successfully"
        )
    )
})


export {
    getVideoStats,
    getChannelVideo
}