import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        Trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        Trim: true,
    },
    fullName: {
        type: String,
        required: true,
        Trim: true,
        index: true,
    },
    avatar: {
        type: String, //cloudinary
        required: true,
    },
    coverImage: {
        type: String,
    },
    watchHistory: [{
        type: mongoose.schema.Types.ObjectID,
        ref: "Video"
    }],
    password: { //(bcrypt)
        type: String,
        required: [true, "password is required"]
    },
    refreshToken: { //jwt(jsonwebtoken)
        type: String
    }
}, {
    timestamps: true
})

//(IMP!!!!) bcrypt using mongoose(pre hooks) as middleware which encrypt the password just before saving the
//data of the user.

userSchema.pre("save", async function(next) {
        if (!this.isModified("password"))
            return next()
        this.password = bcrypt.hash(this.password, 10)
        next()
    })
    // (IMP!!!) bcrypt can also cpmpare the password input by the user(password) and the password saved in the 
    //database (this.password) and returns a boolen value true or false.  
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
            _id: this._id,
            username: this.username, // payloads
            email: this.email,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model('User', userSchema)