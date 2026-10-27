const express = require('express');
const router = express.Router();

const {
    getCurrentUser,
    updateCurrentUser,
    getUser
} = require('../controllers/users');

router.route('/me').get(getCurrentUser).patch(updateCurrentUser);
router.route('/:id').get(getUser);

module.exports = router;