import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express()

app.use(cors({
        origin: process.env.CORS_ORIGIN,
        Credentials: true
    })) // (initiLise middleware cors using app.use)
app.use(cookieParser())

export { app };