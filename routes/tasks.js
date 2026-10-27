const express = require('express');
const router = express.Router();

const {
    getTask,
    updateTask,
    deleteTask
} = require('../controllers/tasks');

router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);

module.exports = router;