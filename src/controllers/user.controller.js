import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { removeOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAcessAndRefreshToken = async (userId) => {
     try {
          const user = await User.findById(userId)
          const accessToken = user.generateAcessToken();
          const refreshToken = user.generateRefreshToken();

          user.refreshToken = refreshToken
          await user.save({ validateBeforeSave: false});

          return { accessToken, refreshToken }
     } catch (error) {
          throw new ApiError(500, "something wrong went generate access and refresh token")
     }
}


const registerUser = asyncHandler( async (req,res) => {
   const {username, email, fullname, password} = req.body

   if(
    [username, email, fullname, password].some((field) => field?.trim() === "")
   ){
        throw new ApiError(400, "All field are required")
   }

   const exitstedUser = await User.findOne({
        $or: [{ email },{ username }]
   })

   if(exitstedUser){
        throw new ApiError(409, "User with email or username already exitst")
   }

   const avtarLocalPath = req.files?.avatar[0]?.path
//    const coverImageLocalPath = req.files?.coverImage[0]?.path

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
          coverImageLocalPath = req.files.coverImage[0].path;
   }

   if(!avtarLocalPath){
        throw new ApiError(400, "Avatar is required");
   }

   const avatar = await uploadOnCloudinary(avtarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
        throw new ApiError(400, "Avatar is required");
   }

   const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password
   })

   const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
   )

   if(!createdUser){
        throw new ApiError(500, "Something went wrong registering the user")
   }

   return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
   )
})


const loginUser = asyncHandler( async (req,res) => {
     const { username, email, password } = req.body

     if(!(username || email)){
          throw new ApiError(400, "username or email is required")
     }

     const user = await User.findOne({
          $or: [{ username }, { email }]
     })

     if(!user){
          throw new ApiError(404, "user does not exits")
     }

     const isPasswordValid = await user.isPasswordCorrect(password)

     if(!isPasswordValid){
          throw new ApiError(401, "password does not exits")
     }

     const { accessToken, refreshToken} = await generateAcessAndRefreshToken(user._id)

     const loggedInUser = await User.findById(user._id).select(
          "-password -refreshToken"
     )

     const option = {
          httpOnly: true,
          secure: true
     }

     return res
     .status(200)
     .cookie("accessToken", accessToken, option)
     .cookie("refreshToken", refreshToken, option)
     .json(
          new ApiResponse(
               200,
               {
                    user: loggedInUser, accessToken, refreshToken
               },
               "User logged In successfully"
          )
     )
})


const logoutUser = asyncHandler( async (req,res) => {
     await User.findByIdAndUpdate(
          req.user._id,
          {
               $unset: {
                    refreshToken: 1
               }
          },
          {
               new: true
          }
     )

     const option = {
          httpOnly: true,
          secure: true
     }

     return res
     .status(200)
     .clearCookie("accessToken",option)
     .clearCookie("refreshToken", option)
     .json(
          new ApiResponse(
               200,
               {},
               "User logged out successfully"
          )
     )
})


const refreshAccessToken = asyncHandler( async (req,res) => {
     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

     if (!refreshAccessToken) {
          throw new ApiError(401, "unauthorized request")
     }

     try {
          const decodedToken = jwt.verify(
               incomingRefreshToken,
               process.env.REFRESH_TOKEN_SECRET
          )
     
          const user = await User.findById(decodedToken?._id)
     
          if (!user) {
               throw new ApiError(401, "Invalid refresh token")
          }
     
          if (incomingRefreshToken !== user.refreshToken) {
               throw new ApiError(401, "Refresh token is expired or used")
          }
     
          const options = {
               httpOnly: true,
               secure: true
          }
     
          const { accessToken, refreshToken} = await generateAcessAndRefreshToken(user._id)
     
          return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(
               new ApiResponse(
                    200,
                    { accessToken, refreshToken},
                    "access token refreshed"
               )
          )
     } catch (error) {
          throw new ApiError(401, error?.message || "Invalid refresh token")
     }
})


const changeCurrentPassword = asyncHandler( async (req,res) => {
     const { oldPassword, newPassword} = req.body

     const user = await User.findById(req.user?._id)

     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

     if (!isPasswordCorrect) {
          throw new ApiError(400, "Invalid password")
     }

     user.password = newPassword
     await user.save({validateBeforeSave: false})

     return res
     .status(200)
     .json(
          new ApiResponse(
               200,
               {},
               "password changed successfully"
          )
     )
})


const getCurrentUser = asyncHandler( async (req,res) => {
     return res
     .status(200)
     .json(
          new ApiResponse(
               200,
               req.user,
               "current user fetched successfully"
          )
     )
})


const updateAccountDetails = asyncHandler( async (req,res) => {
     const {username, email, fullname} = req.body

     if (!(username || email || fullname)) {
          throw new ApiError(400, "all fields are required")
     }

     const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
               $set: {
                    username: username.toLowerCase(),
                    email,
                    fullname
               }
          },
          {new: true}
     ).select("-password")

     return res
     .status(200)
     .json(
          new ApiResponse(
               200,
               user,
               "account updated successfully"
          )
     )
})


const updateUserAvtar = asyncHandler( async (req,res) => {
     const userDetails = await User.findById(req.user?._id)

     if (!userDetails) {
          throw new ApiError(400, "user not found")
     }
     
     const url = userDetails.avatar.split("/")
     const filename = url[url.length - 1]
     const publicId = filename.split(".")[0]
     // console.log(publicId);

     const removeAvatar = await removeOnCloudinary(publicId)

     const avatarLocalPath = req.file?.path

     if (!avatarLocalPath) {
          throw new ApiError(400, "Avatar file is missing")
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath)

     if (!avatar.url) {
          throw new ApiError(400, "Error while uploading avatar")
     }

     const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
               $set: {
                    avatar: avatar.url
               }
          },
          {new: true}
     ).select("-password")

     return res
     .status(200)
     .json(
          new ApiResponse(
               200,
               user,
               "avatar uploading successfully"
          )
     )
})


const updateUserCoverImage = asyncHandler( async (req,res) => {
     const userDetails = await User.findById(req.user?._id)

     if (!userDetails) {
          throw new ApiError(400, "user not found")
     }
     
     const url = userDetails.coverImage.split("/")
     const filename = url[url.length - 1]
     const publicId = filename.split(".")[0]
     // console.log(publicId);

     const removeCoverImage = await removeOnCloudinary(publicId)

     const coverImageLocalPath = req.file?.path

     if (!coverImageLocalPath) {
          throw new ApiError(400, "Cover image file is missing")
     }

     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

     if (!coverImage.url) {
          throw new ApiError(400, "Error while uploading cover image")
     }

     const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
               $set: {
                    coverImage: coverImage.url
               }
          },
          {new: true}
     ).select("-password")

     return res
     .status(200)
     .json(
          new ApiResponse(
               200,
               user,
               "avatar uploading successfully"
          )
     )
})


const getUserChannelProfile = asyncHandler( async (req,res) => {
     const {username} = req.params

     if (!username?.trim()) {
          throw new ApiError(400, "username is missing")
     }

     const channel = await User.aggregate([
          {
               $match: {
                    username: username?.toLowerCase()
               }
          },
          {
               $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
               }
          },
          {
               $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
               }
          },
          {
               $addFields: {
                    subscribeCount: {
                         $size: "$subscribers"
                    },
                    channelsSubscribedToCount: {
                         $size: "$subscribedTo"
                    },
                    isSubscribed: {
                         $cond: {
                              if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                              then: true,
                              else: false
                         }
                    }
               }
          },
          {
               $project: {
                    fullname: 1,
                    username: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribeCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1
               }
          }
     ])

     if (!channel?.length) {
          throw new ApiError(404, "channel does not exists")
     }

     return res
     .status(200)
     .json(
          new ApiResponse(
               200,
               channel[0],
               "user channel fetched successfully"
          )
     )
})


const getWatchHistroy = asyncHandler( async (req,res) => {
     const user = await User.aggregate([
          {
               $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
               }
          },
          {
               $lookup: {
                    from: "videos",
                    localField: "watchHistroy",
                    foreignField: "_id",
                    as: "watchHistroy",
                    pipeline: [
                         {
                              $lookup: {
                                   from: "users",
                                   localField: "owner",
                                   foreignField: "_id",
                                   as: "owner",
                                   pipeline: [
                                        {
                                             $project: {
                                                  fullname: 1,
                                                  username: 1,
                                                  avatar: 1
                                             }
                                        }
                                   ]
                              }
                         },
                         {
                              $addFields: {
                                   owner: {
                                        $first: "$owner"
                                   }
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
               user[0].watchHistroy,
               "watch history fetched successfully"
          )
     )
})


const removeVideoFromWatchHistroy = asyncHandler(async(req,res) => {
     const {videoId} = req.params

     if (!videoId) {
          throw new ApiError(400, "videoId is missing")
     }

     const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
               $pull: {
                    watchHistroy: videoId
               }
          },
          {
               new: true
          }
     ).select(
          "-password -refreshToken"
     )

     return res
     .status(200)
     .json(
          new ApiResponse(
               200,
               user,
               "video removed in watch histroy"
          )
     )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistroy,
    removeVideoFromWatchHistroy
}