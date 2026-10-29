const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'must provide name'],
        trim: true
    },
    username: {
        type: String,
        required: [true, 'must provide username'],
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: [true, 'must provide email'],
        lowercase: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: [true, 'must provide password'],
        select: false,
    },
    job_title: {
        type: String,
    },
    biography: {
        type: String,
        maxlength: [500, 'biography can not be over 500 characters']
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
}, {timestamps: true});

module.exports = mongoose.model('User', UserSchema);