import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route('/register').post(registerUser)
    // IMP COMMENTS!!!!!
    //https://localhost:8000/user/register
    //here we can make many different controllers and we can import all of them here as post methods
    //for example if we create a new controller named login then
    //new route is defined as
    //router.route('/login).post(loginUser) where login user is a controller
    //https://localhost:8000/user/login

export default router;