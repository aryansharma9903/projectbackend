//require('dotenv').config({ path: './env' })
import dotenv from "dotenv"
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express"
const app = express()

dotenv.config({
    path: './env'
});

(async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`mongoDb Connected!' DB host: ${connectionInstance.connection.host}`);
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`listening to port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("MongoDb connection ERROR: ", error);
        throw error
    }
})()
// OR
//.then(() => {
//         app.on("error", (error) => {
//             console.log("ERROR: ", error);
//             throw error
//         })
//         app.listen(process.env.PORT || 8000, () => {
//             console.log(`server running at port ${process.env.PORT}`);
//         })
//     }

// ).catch((err) => {
//     console.log("mongodb connection failed!!", err)
// })

//mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)