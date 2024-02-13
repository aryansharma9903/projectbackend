import { apiError } from "../utils/apierrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler(async(req, res) => {
    //get user details from front-end
    const { username, fullName, email, password } = req.body
    console.log("email: ", email);

    //validation(is format of email correct?, is username empty or not, etc)
    // if(fullName === ""){
    //     throw new apiError(400, "fullname is required")
    // }
    //or
    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new apiError(400, "all fields required")
    }
    if (!email.includes('@')) {
        throw new apiError(400, "email is invalid")
    }
    //check if user exists: username or email(unique)
    //for this we need to match the user data from the whole database using the user object created
    //in mongooes, open user models in mongoose
    //import that user
    const existedUser = User.findone({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new apiError(409, "User with email or username already exist")
    }

    //check for images, check for avatar(required)
    //req.body to get all the data
    //multer provides us with req.files to get only files
    const avatarLocalPath = req.files?.avatar[0]?.path; //get all the files(avatar) given by user
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "avatar file is required");
    }

    //upload them to cloudinary, avatar uploaded or not
    const avatar = await uploadOnCloudinary(avatarLocalPath) // see the code for cloudinary where localfile path is taken as arg
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new apiError(400, "avatar not uploaded")
    }
    //create user object - create entry in db

    const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            //if coverimage present then take, else "khaali"
            email,
            password,
            username: username.toLowerCase(),
        })

        //check for user creation is successful? (response)
                //(while creating user entries in db, user_id is developed unique for user
        //remove password and refresh token from response        
            const createdUser = await User.findById(user._id).select(
                "-password -refreshToken"
            )    

        if (!createdUser) {
            throw new apiError(500, "something went wrong while registering user")
        }    
        //return resp
        return res.status(201).json(
            new apiResponse(200, createdUser, "user registered successfully")
        )

})

export { registerUser }