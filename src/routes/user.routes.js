import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
//importing a middleware for file handling


const router = Router()

router.route("/register").post( //using the multer middleware now we can send images or files to cloudinary
    upload.fields([{
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser) //injecting middleware just before passing control to the controllers
    // IMP COMMENTS!!!!!
    //https://localhost:8000/users/register
    //here we can make many different controllers and we can import all of them here as post methods
    //for example if we create a new controller named login then
    //new route is defined as
    //router.route('/login).post(loginUser) where login user is a controller
    //https://localhost:8000/users/login
router.route("/refresh-token").post(refreshAccessToken)
export default router;





//routes
//import controller
//imoort {Router} from express
//import {upload} from "../middleware/multer.middleware.js"

// const router = Router();

//router.route('/register').post(
//    upload.fields([
//         {
//             name: 'avatar',
//             maxCount: 1,
//  //       },
//         {
//                 name: "coverImage",
//                 maxCount: 1,
// //         }
//])
//   registerUser
//   )