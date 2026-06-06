import Joi from 'joi';

export const validateMessage = (data) => {
    const schema = Joi.object({
        room: Joi.string().required(),
        sender: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
            'string.pattern.base': 'User ID must be a valid MongoDB ObjectId'
        }),
        text: Joi.string().min(1).required()
    });

    return schema.validate(data);
};