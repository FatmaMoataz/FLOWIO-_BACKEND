import mongoose from 'mongoose';
import Joi from 'joi';

const subscriptionPlanEnum = {
    free: 'free',
    basic: 'basic',
    premium: 'premium'
};

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: [2, 'Company name must be at least 2 characters long'],
        maxLength: [50, 'Company name cannot exceed 50 characters']
    },
    industry: {
        type: String,
        required: true,
        trim: true,
        minLength: [2, 'Industry must be at least 2 characters long'],
        maxLength: [50, 'Industry cannot exceed 50 characters']
    },
    subscriptionPlan: {
        type: String,
        required: true,
        enum: Object.values(subscriptionPlanEnum),
        default: subscriptionPlanEnum.free,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
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

const Company = mongoose.model('Company', companySchema);

function validateCompany(company) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required(),
        industry: Joi.string().min(2).max(50).required(),
        subscriptionPlan: Joi.string().valid(...Object.values(subscriptionPlanEnum)).required(),
        userId: Joi.string().hex().length(24).optional(),
        teamId: Joi.string().hex().length(24).optional(),
        projectId: Joi.string().hex().length(24).optional()
    });

    return schema.validate(company);
}

function validateCompanyUpdate(company) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50),
        industry: Joi.string().min(2).max(50),
        subscriptionPlan: Joi.string().valid(...Object.values(subscriptionPlanEnum)),
        userId: Joi.string().hex().length(24),
        teamId: Joi.string().hex().length(24),
        projectId: Joi.string().hex().length(24)
    });

    return schema.validate(company);
}

export { Company, subscriptionPlanEnum, validateCompany, validateCompanyUpdate };