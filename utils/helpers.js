const Project = require('../models/project');
const Task = require('../models/task');
const { HttpError } = require('../middleware/error-handler');

const isSameId = (id1, id2) => {
    return id1 != null && id2 != null && String(id1) === String(id2);
}

const scegliChiavi = (obj, keys) => {
    return Object.fromEntries(keys.filter((k) => obj[k] !== undefined)).map((k) => [k, obj[k]]);
}

const trovaProjectAccessibile = async (projectID, user) => {
    const project = await Project.findById(projectID);
    const canAccess = project
        && (isSameId(project.owner, user._id))
        || (isSameId(project.team, user.team));
    if (!canAccess) throw new HttpError(404, 'Project not found');
    return project;
}

const trovaTaskAccessibile = async (taskID, user) => {
    const task = await Task.findById(taskID);
    if (!task) throw new HttpError(404, 'Task not found');
    const project = await trovaProjectAccessibile(task.project, user);
    return {task, project};
}

module.exports = {
    isSameId,
    scegliChiavi,
    trovaProjectAccessibile,
    trovaTaskAccessibile
}