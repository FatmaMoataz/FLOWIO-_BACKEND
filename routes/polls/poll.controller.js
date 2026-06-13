import pollService from "./poll.service.js";
import Notification from '../../models/notification.js';
import Poll from '../../models/poll.js'; 
import { User } from '../../models/user.js';
import { createPollSchema, votePollSchema, idParamSchema } from "../../validations/pollValidation.js";

const createPoll = async (req, res, next) => {
  const pollData = { ...req.body, userId: req.user._id };

  const { error } = createPollSchema.validate(pollData);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await pollService.createPollService(pollData);

    const notifyUserIds = req.body.notifyUserIds || [];
    if (notifyUserIds.length > 0) {
      const fromUser = await User.findById(req.user._id).select('name');

      await Promise.all(
        notifyUserIds
          .filter(id => String(id) !== String(req.user._id))
          .map(userId =>
            Notification.create({
              title: "New Poll",
              message: `${fromUser.name} created a poll: "${pollData.question?.slice(0, 60)}"`,
              type: "POLLS",
              userId,
              fromUserId: req.user._id,
              referenceId: result.data._id,
              referenceModel: "Poll",
            })
          )
      );
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const votePoll = async (req, res, next) => {
  const voteData = {
    pollId: req.body.pollId,
    optionText: req.body.optionText,
    userId: req.user._id,
  };

  const { error } = votePollSchema.validate(voteData);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const result = await pollService.votePollService(voteData);
    
    const [poll, fromUser] = await Promise.all([
      Poll.findById(req.body.pollId).select('userId question'),
      User.findById(req.user._id).select('name'),
    ]);

    if (poll && String(poll.userId) !== String(req.user._id)) {
      await Notification.create({
        title: "New Vote",
        message: `${fromUser.name} voted on your poll: "${poll.question?.slice(0, 60)}"`,
        type: "POLLS",
        userId: poll.userId,
        fromUserId: req.user._id,
        referenceId: poll._id,
        referenceModel: "Poll",
      });
    }

    // Send back the updated poll data
    res.status(200).json({
      success: true,
      message: "Vote added successfully",
      data: result.data
    });
    
  } catch (err) {
    if (err.code === 11000 || err.message === "You have already voted in this poll!") {
      return res.status(400).json({ 
        success: false, 
        message: "You have already voted in this poll!" 
      });
    }
    next(err);
  }
};

const getAllPolls = async (req, res, next) => {
  try {
    const result = await pollService.getAllPollsService();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

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