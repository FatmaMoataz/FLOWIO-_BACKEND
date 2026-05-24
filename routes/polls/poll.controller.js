import pollService from './poll.service.js';
import Joi from 'joi';
import { createPollSchema, votePollSchema, idParamSchema } from '../../validations/pollValidation.js';

// CREATE
const createPoll = async (req, res, next) => {
  const { error } = createPollSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await pollService.createPollService(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// GET ALL
const getAllPolls = async (req, res, next) => {
  try {
    const result = await pollService.getAllPollsService();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// VOTE
const votePoll = async (req, res, next) => {
  const { error } = votePollSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await pollService.votePollService(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// RESULTS
const getResults = async (req, res, next) => {
  const { error } = idParamSchema.validate({ id: req.params.id });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await pollService.getPollResultsService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export {
  createPoll,
  getAllPolls,
  votePoll,
  getResults
};