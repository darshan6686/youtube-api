import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import 
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import tweetRoute from './routes/tweet.routes.js';
import commentRoute from './routes/comment.routes.js';
import likeRoute from './routes/like.routes.js';
import dashboardRoute from './routes/dashboard.routes.js';
import healthcheckRoute from './routes/healthcheck.routes.js';

// router declartions
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/tweets", tweetRoute)
app.use("/api/v1/comments", commentRoute)
app.use("/api/v1/likes", likeRoute)
app.use("/api/v1/dashboard", dashboardRoute)
app.use("/api/v1/healthcheck", healthcheckRoute)

export { app }