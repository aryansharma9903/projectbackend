import { apiError } from "../utils/apierrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { response } from "express";
//check this code for login user
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const inputUser = await User.findById(userId)
        const accessToken = inputUser.generateAccessToken()
        const refreshToken = inputUser.generateRefreshToken()

        //refresh token is saved in the databse to prevent user to login again and again(require password)
        inputUser.refreshToken = refreshToken
        await inputUser.save({validateBeforeSave: false})
        return {refreshToken, accessToken}

    } catch (error) {
        throw new apiError(500, "something went wrong while generating access and refrsh token")
    }
}
// main code starts here
//register user
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
        [fullName, email, username, password].some((field) => field?.trim() === "")
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
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new apiError(409, "User with email or username already exist")
    }

    //check for images, check for avatar(required)
    //req.body to get all the data
    //multer provides us with req.files to get only files

    const avatarLocalPath = req.files?.avatar[0]?.path; //get all the files(avatar) given by user
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    //Array.isArray is a method to check whether a variable is an array or not (with arg as an array)
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0) {
        req.files.coverImage[0].path
    }

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
                //while creating user entries in db, user_id is developed unique for user
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

//login user
const loginUser = asyncHandler(async (req,res) => {
//1) taking username and password from user (req.body)

const { username, password, email } = req.body;
if (!username || !email) {
    throw new apiError(404, "username or email is required");
}
//2) check if username or email matches with one's registered on database, if not then throw error
// user not registered, pls register

   const inputUser = await User.findOne({
        $or: [{email}, {username}]// to check whether either of email or username is present in the database
    })
    if (!inputUser) {
        throw new apiError(400, "user does not exist, please register")
    }

    //2.1)if present then match password
    const isPasswordValid = await inputUser.isPasswordCorrect(password)

        //2.11) wrong password, then show wrong password
            if (!isPasswordValid) {
                throw new apiError(401, "password invalid");
            }
        //2.12) if correct give access and refresh token
        const{accessToken, refreshToken} = await generateAccessAndRefreshToken(inputUser._id)
            //making a generalised function at the top
    //2.2) else message pls register
        const loggedInUser = await inputUser.findById(inputUser._id).select("-password -refreshToken")
//3) send cookie

const options = {
    httpOnly: true,
    secure: true,
}

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new apiResponse(200,
        {
        user: loggedInUser, accessToken, refreshToken
        },
        "user logged in successfully"
    )
)
})
//logout user

const logoutUser = asyncHandler( async (req,res)=> {

})

export { registerUser }
export { loginUser }