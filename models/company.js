import mongoose from 'mongoose';
import Joi from 'joi';

// CHANGED: renamed/extended to match the plan ids used by the onboarding UI
// (was: free/basic/premium, which the frontend never sent and would have
// failed Joi validation if it had).
const subscriptionPlanEnum = {
    free: 'free',
    starter: 'starter',
    pro: 'pro',
    enterprise: 'enterprise',
};

const billingCycleEnum = {
    monthly: 'monthly',
    yearly: 'yearly',
};

const subscriptionStatusEnum = {
    none: 'none',
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
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
    // NEW: needed so we know which Stripe price to bill / display
    billingCycle: {
        type: String,
        enum: [...Object.values(billingCycleEnum), null],
        default: null,
    },
    // NEW: drives Stripe subscription item quantity (per-seat pricing)
    seats: {
        type: Number,
        default: 1,
        min: 1,
    },
    // NEW: Stripe linkage
    stripeCustomerId: {
        type: String,
        default: null,
    },
    stripeSubscriptionId: {
        type: String,
        default: null,
    },
    subscriptionStatus: {
        type: String,
        enum: Object.values(subscriptionStatusEnum),
        default: subscriptionStatusEnum.none,
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

const Company = mongoose.model('Company', companySchema);

function validateCompany(company) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required(),
        industry: Joi.string().min(2).max(50).required(),
        subscriptionPlan: Joi.string().valid(...Object.values(subscriptionPlanEnum)).required(),
        billingCycle: Joi.string().valid(...Object.values(billingCycleEnum)).optional().allow(null),
        seats: Joi.number().min(1).optional(),
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
        billingCycle: Joi.string().valid(...Object.values(billingCycleEnum)).allow(null),
        seats: Joi.number().min(1),
        stripeCustomerId: Joi.string().allow(null),
        stripeSubscriptionId: Joi.string().allow(null),
        subscriptionStatus: Joi.string().valid(...Object.values(subscriptionStatusEnum)),
        userId: Joi.string().hex().length(24),
        teamId: Joi.string().hex().length(24),
        projectId: Joi.string().hex().length(24)
    });

    return schema.validate(company);
}

export {
    Company,
    subscriptionPlanEnum,
    billingCycleEnum,
    subscriptionStatusEnum,
    validateCompany,
    validateCompanyUpdate,
};