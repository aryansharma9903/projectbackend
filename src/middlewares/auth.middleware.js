import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { apiError } from "../utils/apierrors.js";
//import jsonwebtoken from "jsonwebtoken";
// designing this middleware for logging out user

export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        //getting token from either cookies or from header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
            //req has access to cookies by cookieparser()
        if (!token) {
            throw new apiError(401, "unauthorised request")
        }
        // now we'll check whether this token is correct or not
        //jwt.verify() method is directly used
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        //this decoded token will have the info about the user passed in the access token
        //check user models jwt.sign() method
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new apiError(401, "invalid access token");
        }
        req.user = user;
        next()
    } catch (error) {
        throw new apiError(401, error?.message || message("invalid access token"))
    }
})