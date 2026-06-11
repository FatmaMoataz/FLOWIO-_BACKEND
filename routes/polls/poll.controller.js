// poll.controller.js — FULL REWRITE

import pollService from "./poll.service.js";
import { createPollSchema, votePollSchema, idParamSchema } from "../../validations/pollValidation.js";

// ── CREATE ─────────────────────────────────────────────────────────────────────
const createPoll = async (req, res, next) => {
  const pollData = { ...req.body, userId: req.user._id };

  const { error } = createPollSchema.validate(pollData);
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });

  try {
    const result = await pollService.createPollService(pollData);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// ── GET ALL ────────────────────────────────────────────────────────────────────
const getAllPolls = async (req, res, next) => {
  try {
    const result = await pollService.getAllPollsService();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// ── VOTE ───────────────────────────────────────────────────────────────────────
const votePoll = async (req, res, next) => {
  // userId always comes from the verified token, never from req.body
  const voteData = {
    pollId: req.body.pollId,
    optionText: req.body.optionText,
    userId: req.user._id,
  };

  const { error } = votePollSchema.validate(voteData);
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });

  try {
    const result = await pollService.votePollService(voteData);
    res.status(200).json(result);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "You have already voted in this poll!" });
    }
    next(err);
  }
};

// ── RESULTS ────────────────────────────────────────────────────────────────────
const getResults = async (req, res, next) => {
  const { error } = idParamSchema.validate({ id: req.params.id });
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });

  try {
    const result = await pollService.getPollResultsService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export { createPoll, getAllPolls, votePoll, getResults };