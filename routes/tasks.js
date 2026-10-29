const express = require('express');
const router = express.Router();

const {
    getTask, updateTask, deleteTask,
    addComment, updateComment, deleteComment,
    addWorklog, deleteWorklog
} = require('../controllers/tasks');

router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);
router.route('/:id/comments').post(addComment);
router.route('/:id/comments/:commentId').patch(updateComment).delete(deleteComment);
router.route('/:id/worklogs').post(addWorklog);
router.route('/:id/worklogs/:worklogId').delete(deleteWorklog);

module.exports = router;