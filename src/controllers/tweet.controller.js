import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTweet = asyncHandler(async(req,res) => {
    const {content} = req.body

    if (!content) {
        throw new ApiError(400, "All field is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "tweet created successfully"
        )
    )
})


const getUserTweet = asyncHandler(async(req,res) => {
    const {userId} = req.params

    if (!userId) {
        throw new ApiError(400, "userId is missing")
    }

    const tweet = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
                            avatar: 1,

                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "user tweet fetched successfully"
        )
    )
})


const updateTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params
    const {content} = req.body

    if (!tweetId) {
        throw new ApiError(400, "tweetId is missing")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            }
        },
        {
            new: true,
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "tweet updated successfully"
        )
    )
})


const deleteTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params

    if (!tweetId) {
        throw new ApiError(400, "tweetId is missing")
    }

    const tweet = await Tweet.findByIdAndDelete(
        tweetId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "tweet deleted successfully"
        )
    )
})


export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}