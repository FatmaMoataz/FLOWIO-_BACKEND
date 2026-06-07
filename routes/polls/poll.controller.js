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
// تعديل الـ vote داخل poll.controller.js
const votePoll = async (req, res, next) => {
  // دمج الـ userId اللي جاي من الـ Token المحمي مع الـ body
  const voteData = { ...req.body, userId: req.user._id };

  const { error } = votePollSchema.validate(voteData);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await pollService.votePollService(voteData);
    res.status(201).json(result);
  } catch (err) {
    // معالجة خطأ التصويت المتكرر بسبب الـ Unique Index اللي إنتِ عاملاه 🛑
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already voted in this poll!" });
    }
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