import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleVideoLike = asyncHandler(async(req,res) => {
    const {videoId} = req.params

    if (!videoId) {
        throw new ApiError(400, "videoId is missing")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "video not found")
    }

    const alreadyLikedVideo = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    let liked
    let status

    if (alreadyLikedVideo) {
        status = false
        liked = await Like.findByIdAndDelete(
            alreadyLikedVideo?._id
        )
    } else {
        status = true
        liked = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                status,
                liked
            },
            `video ${status ? "liked" : "unliked"} successfully`
        )
    )
})


const toggleCommentLike = asyncHandler(async(req,res) => {
    const {commentId} = req.params

    if (!commentId) {
        throw new ApiError(400, "commentId is missing")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "comment not found")
    }

    const alreadyLikedComment = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    let liked
    let status

    if (alreadyLikedComment) {
        status = false
        liked = await Like.findByIdAndDelete(
            alreadyLikedComment?._id
        )
    }
    else {
        status = true
        liked = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                status,
                liked
            },
            `comment ${status ? "liked" : "unliked"} successfully`
        )
    )
})


const toggleTweetLike = asyncHandler(async(req,res) => {
    const {tweetId} = req.params

    if (!tweetId) {
        throw new ApiError(400, "tweetId is missing")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "tweet not found")
    }

    const alreadyLikedTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    let liked
    let status

    if (alreadyLikedTweet) {
        status = false
        liked = await Like.findByIdAndDelete(
            alreadyLikedTweet?._id
        )
    }
    else {
        status = true
        liked = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                status,
                liked
            },
            `tweet ${status ? "liked" : "unliked"} successfully`
        )
    )
})


const getLikedVideo = asyncHandler(async(req,res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user?._id,
                video: { $exists: true}
            }
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
                            thumbnail: 1,
                            videoFile: 1,
                            owner: 1
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
                                        avatar: 1,
                                        fullname: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
        },
        {
            $unwind: "$video.owner"
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            "liked video fetched successfully"
        )
    )
})


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideo
}