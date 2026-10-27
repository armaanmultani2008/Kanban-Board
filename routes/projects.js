const express = require('express');
const router = express.Router();

const {
    getProjects,
    createProject,
    getProject,
    deleteProject,
    updateProject
} = require('../controllers/projects');

const {
    getProjectTasks,
    createTask,
} = require('../controllers/tasks');

router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).patch(updateProject).delete(deleteProject);
router.route('/:id/tasks').get(getProjectTasks).post(createTask);

module.exports = router;