import { asyncHandler } from "../utils/asyncHandler";
// designing this middleware for logging out user

export const verifyJWT = asyncHandler(async(req, res, next) => {
    req.cookies ? .accessToken || req.header("Authorization")
})