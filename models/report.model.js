const mongoose = require('mongoose');
const Joi = require('joi');

const reportEnum = {
    bug: 'bug',
    feature: 'feature',
    task: 'task',
    other: 'other'
};

const reportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minLength: [2, 'Report title must be at least 2 characters long'],
        maxLength: [50, 'Report title cannot exceed 50 characters']
    },
    content: {
        type: String,
        required: true,
        trim: true,
        minLength: [10, 'Report content must be at least 10 characters long'],
        maxLength: [1000, 'Report content cannot exceed 1000 characters']
    },
    type: {
        type: String,
        required: true,
        enum: ['bug', 'feature', 'task', 'other']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
//try catch for pre validate

const Report = mongoose.model('Report', reportSchema);

module.exports = {
    Report,
    reportEnum
};