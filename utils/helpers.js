const Project = require('../models/project');
const Task = require('../models/task');
const User = require('../models/user');

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const isSameId = (id1, id2) => {
    return id1 != null && id2 != null && String(id1) === String(id2);
}

const scegliChiavi = (obj, keys) => {
    return Object.fromEntries(keys.filter((key) => obj[key] !== undefined).map((key) => [key, obj[key]]));
}

const trovaProjectAccessibile = async (projectID, user) => {
    const project = await Project.findById(projectID);
    const ownerInTeam = project && user.team
        ? await User.exists({_id: project.owner, team: user.team})
        : false;
    const canAccess = project && (
        isSameId(project.owner, user._id)
        || isSameId(project.team, user.team)
        || ownerInTeam
    );
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
    HttpError,
    isSameId,
    scegliChiavi,
    trovaProjectAccessibile,
    trovaTaskAccessibile
}