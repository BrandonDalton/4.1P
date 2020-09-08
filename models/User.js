const mongoose = require("mongoose")
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new mongoose.Schema(
    {
        username: String,
        password: String,
        _id: {
            type: String,
            required: true
        },
        fname: {
            type: String,
            trim: true,
            required: true
        },
        lname: {
            type: String,
            trim: true,
            required: true
        },
        email: {
            type: String,
            trim: true,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        postcode: {
            type: String
        },
        mobile: {
            type: String
        }
    }
)

userSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model("User", userSchema)
