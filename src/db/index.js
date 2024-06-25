import mongoose from "mongoose";
import { DB_NAME } from "../constans.js";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\n mongodb connected !! DB Host: ${connection.connection.host}`);
    } catch (error) {
        console.log('mongodb connection failed ', error);
        process.exit(1);
    }
}

export default connectDB