import { asyncHandler } from "../utils/asyncHandler.js"

const registerUser = asyncHandler(async(req, res) => {
    //get user details from front-end
    const { username, fullName, email, password } = req.body
    console.log("email: ", email);


    //validation(is format of email correct?, is username empty or not, etc)
    //check if user exists: username or email(unique)
    //check for images, check for avatar(required)
    //upload them to cloudinary, avatar uploaded or not
    //create user object - create entry in db
    //remove password and refresh token from response
    //check for user creation is successful? (response)
    //return resp
})

export { registerUser }