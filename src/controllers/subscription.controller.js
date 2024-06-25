import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";


const toggleSubscription = asyncHandler(async(req,res) => {
    const {channelId} = req.params

    if (!channelId) {
        throw new ApiError(400, "channelId is missing")
    }

    const channel = await User.findById(channelId)

    if (!channel) {
        throw new ApiError(400, "channel not found")
    }

    const channelTosubscribe = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id
    })

    let subscribeStatus;
    let status;

    if (channelTosubscribe) {
        status = false
        subscribeStatus = await Subscription.findByIdAndDelete(
            channelTosubscribe?._id
        )
    }
    else {
        status = true
        subscribeStatus = await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id
        })
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribeStatus,
            `channel ${status ? "subscirbed": "unsubscribed"} sucessfully`
        )
    )
})


const getUserChannelSubscribers = asyncHandler(async(req,res) => {
    const {channelId} = req.params

    if (!channelId) {
        throw new ApiError(400, "channelId is missing")
    }

    const suscriber = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber_details",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                            email: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber_details"
        }
    ])

    if (!suscriber?.length) {
        throw new ApiError(400, "channel not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            suscriber,
            "subscriber list fetched successfully"
        )
    )
})


const getSubscriberChannel = asyncHandler(async(req,res) => {
    // const {subscriberId} = req.params
    
    const channel = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel_details",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            email: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channel_details"
        }
    ])

    if (!channel?.length) {
        throw new ApiError(400, "channel not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel,
            "channel list fetched successfully"
        )
    )
})


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscriberChannel
}