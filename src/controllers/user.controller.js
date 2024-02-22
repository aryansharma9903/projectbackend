import { apiError } from "../utils/apierrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt  from "jsonwebtoken";
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
if (!(username || email)) {
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
    if(!password){
        throw new apiError(400, "password is required");
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
    //sending response to the user except the password and refresh token
        const loggedInUser = await User.findById(inputUser._id).select("-password -refreshToken")
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
//we can't get username email once again to check which user is logging out
//so we need to check the tokens currently used by which user
//to access these we will write a middleware
//then finally, (next line)
//to logout user we need to remove cookies, access token and refresh token


const logoutUser = asyncHandler( async (req,res)=> {
    //we got the user details from the middleware auth, now we have the user info
    //we can clear the cookies and tokens
    await User.findByIdAndUpdate(
        //finds the user by id and then updates the fields as per the need
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(
        200, {}, "User logged out successfully"
    ))
})
// refresh token is saved in the database, to provide the user with thr token when the access token time expires
// so that user does not have to login again. and refresh the token
// so when the token expires user gets a 401 error
// so we need to create that endpoint which user hits when this error occurs,

const refreshAccessToken = asyncHandler (async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body //user's refresh token
    //we have another refresh token stored in database
    if(!incomingRefreshToken){
        throw new apiError(400, "unauthorised request")
    }
    const decodedToken = jwt.verify(
        incomingRefreshToken, 
        process.env.REFRESH_TOKEN_SECRET
        )
    // now that we have the decoded refresh token, we have the user id
    // while creating refreshtoken(check user models), we passed user_id
    // and using mongodb queries we can get the user information
    // we will find the decoded token id in the user database by find by id
    const user = await User.findById(decodedToken?._id)
    // using this we found a user
    if (!user) {
        throw new apiError(400, "invalid refresh token")
    }
    // now we'll whether thw two users are same or not
    // so now we have two tokens, one saved in databse and one we got from cookies(as incoming refresh token)
    if(incomingRefreshToken !== user?.refreshToken){
        throw new apiError(400, "invalid refresh token")
    }

    //sending new refresh tokens using cookies
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new apiResponse(
            200, 
            {accessToken, refreshToken: newRefreshToken},
            "access token refreshed"
            )
        )


}
)


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}
