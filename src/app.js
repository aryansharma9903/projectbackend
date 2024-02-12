import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express()

app.use(cors({
        origin: process.env.CORS_ORIGIN,
        Credentials: true
    })) // (initiLise middleware cors using app.use)
app.use(cookieParser())


// routes import
import userRouter from './routes/user.routes.js'

//router declaration
//app.get we will not use
app.use('/api/v1/users', userRouter) // from here on any changes in routes will be written in routes folder
    //the methods /users is then passed on to userrouter where all other routes takes place
    //go to user routes for more info



export { app };