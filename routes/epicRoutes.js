const express = require('express');
const router = express.Router();
const Epic = require('../models/epic');
const { validateCreateEpic } = require('../validations/projectValidations');
const auth = require('../middleware/auth');



/**

 * @route   POST /api/epics

 * @desc    Create a new Epic

 * @access  Private

 */

router.post('/', auth, async (req, res) => {

  // 1. Validate request body

  const { error, value } = validateCreateEpic(req.body);

  if (error) {

    const errors = error.details.map((d) => d.message);

    return res.status(400).json({ success: false, errors });

  }
  
  try {

    // 2. Create and persist the Epic
    const epic = await Epic.create(value);
    return res.status(201).json({

      success: true,

      data: epic,

    });
    // GET all epics
  } catch (err) {

    console.error('[POST /epics] Error:', err);

    return res.status(500).json({

      success: false,

      message: 'Server error. Could not create epic.',

    });

  }

});

/**
 * @route   GET /api/epics
 */

router.get('/', async (req, res) => {
  try {
    const epics = await Epic.find().sort('name');
    res.send(epics);
  } catch (err) {
    res.status(500).send('Something failed.');
  }
});



module.exports = router;