import mongoose from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'
const videoSchema = new mongoose.schema({
    videoFile: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    title: {
        type: String, //cloudinary
        required: true,
    },
    description: {
        type: String,
    },
    duration: [{
        type: Number, //cloudinary
        required: true
    }],
    views: {
        type: Number,
        default: zero
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    owner: {
        type: mongoose.schema.Types.ObjectId,
        ref: "User",
    }
}, {
    timestamps: true
})
videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model('Video', videoSchema)