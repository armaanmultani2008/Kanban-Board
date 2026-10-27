const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'must provide a project title'],
        maxlength: [30, 'title can not be more than 30 characters'],
    },
    description: {
        type: String,
        maxlength: [500, 'description can not be more than 500 characters']
    },
    goal: {
        type: String,
    },
    status: {
        type: String,
        enum: ['planned', 'active', 'completed'],
        default: 'planned'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'project must have an owner']
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    }
}, {timestamps: true});

module.exports = mongoose.model('Project', ProjectSchema);