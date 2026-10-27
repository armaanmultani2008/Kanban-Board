const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    summary: {
        type: String,
        required: [true, 'must provide a task summary'],
        maxlength: [100, 'summary can not be more than 100 characters'],
    },
    description: {
        type: String,
        maxlength: [500, 'description can not be more than 500 characters']
    },
    status: {
        type: String,
        enum: ['inbox', 'todo', 'in_progress', 'in_review', 'done'],
        default: 'inbox'
    },
    work_type: {
        type: String,
        enum: ['frontend', 'backend', 'deploy', 'design', 'other'],
        default: 'other'
    },
    priority: {
        type: String,
        enum: ['urgent', 'important', 'medium', 'low', 'lowest'],
        default: 'medium'
    },
    due_date: {
        type: Date
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'must provide task reporter']
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'must provide parent project']
    },
    comments: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        text: {
            type: String,
            required: true
        },
        resolved: {
            type: Boolean,
            default: false
        }
    }],
    worklogs: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {timestamps: true});

module.exports = mongoose.model('Task', TaskSchema);