const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'must provide name'],
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'must provide at least one member']
    }],
    description: {
        type: String,
    },
    goal: {
        type: String,
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'team must have an admin']
    },
    inviteCode: {
        type: String,
        unique: true,
        sparse: true
    }
}, {timestamps: true});

module.exports = mongoose.model('Team', TeamSchema);