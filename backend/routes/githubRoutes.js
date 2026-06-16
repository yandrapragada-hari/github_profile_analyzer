const express = require('express');
const { body, param, validationResult } = require('express-validator');

const githubController = require('../controllers/githubController');
const compareController = require('../controllers/compareController');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
}

const validateUsername = param('username')
  .trim()
  .isLength({ min: 1, max: 100 })
  .withMessage('username must be between 1 and 100 characters')
  .matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/)
  .withMessage('username must be a valid GitHub username');

router.get('/stats', githubController.getStats);

router.get('/profiles', githubController.getAllProfiles);

router.get(
  '/profiles/:username',
  validateUsername,
  handleValidation,
  githubController.getProfileByUsername
);

router.post(
  '/profiles/:username',
  validateUsername,
  handleValidation,
  githubController.analyzeAndUpsertProfile
);

router.put(
  '/profiles/:username/refresh',
  validateUsername,
  handleValidation,
  githubController.refreshProfile
);

router.get(
  '/profiles/:username/history',
  validateUsername,
  handleValidation,
  githubController.getHistory
);

router.get(
  '/profiles/:username/export',
  validateUsername,
  handleValidation,
  githubController.exportProfile
);

router.get(
  '/compare/:user1/:user2',
  [
    param('user1')
      .trim()
      .isLength({ min: 1, max: 100 })
      .matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/)
      .withMessage('user1 must be a valid GitHub username'),
    param('user2')
      .trim()
      .isLength({ min: 1, max: 100 })
      .matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/)
      .withMessage('user2 must be a valid GitHub username'),
  ],
  handleValidation,
  compareController.compareProfiles
);

module.exports = router;

