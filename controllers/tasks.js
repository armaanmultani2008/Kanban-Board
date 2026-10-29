const Task = require('../models/task');
const User = require('../models/user');
const {HttpError, isSameId, scegliChiavi, trovaProjectAccessibile, trovaTaskAccessibile} = require('../utils/helpers');

const TASK_FIELDS = ['summary', 'description', 'status', 'work_type', 'priority', 'due_date', 'assignee'];

const assertValidAssignee = async (project, assigneeID) => {
    if (!assigneeID) return;
    const user = await User.findById(assigneeID).select('team');
    const valid = user && (isSameId(user._id, project.owner) || isSameId(user.team, project.team));
    if (!valid) throw new HttpError(400, 'Assignee is not part of the project');
}

const getProjectTasks = async(req, res) => {
    const project = await trovaProjectAccessibile(req.params.id, req.user);
    const {status, priority, work_type, assignee, search, sort} = req.query;

    const filter = {project: project._id};
    if (typeof status === 'string') filter.status = status;
    if (typeof priority === 'string') filter.priority = priority;
    if (typeof work_type === 'string') filter.work_type = work_type;
    if (assignee === 'me') filter.assignee = req.user._id;
    else if (typeof assignee === 'string') filter.assignee = assignee;
    if (typeof search === 'string' && search.trim()) {
        const escaped = search.trim().replace(/[.*+?{}()|[\]\\]/g, '\\$&');
        filter.summary = {$regex: escaped, $options: i};
    }
    const allowedSort = ['due_date', '-due_date', 'createdAt', '-createdAt'];
    const sortBy = allowedSort.includes(sort) ? sort : '-createdAt';

    const tasks = await Task.find(filter).sort(sortBy).populate('assignee', 'name username');
    res.status(200).json({count: tasks.length, tasks});
}

const createTask = async (req, res) => {
    const taskKeys = ['summary', 'description', 'work_type', 'priority', 'due_date', 'assignee'];
    const project = await trovaProjectAccessibile(req.params.id, req.user);
    const data = scegliChiavi(req.body, taskKeys);
    await assertValidAssignee(project, data.assignee);

    const task = await Task.create({...data, reporter: req.user._id, project: project._id});
    res.status(201).json({task});
}

const getTask = async (req, res) => {
    const {task} = await trovaTaskAccessibile(req.params.id, req.user);
    await task.populate([
        {path: 'assignee', select: 'name username'},
        {path: 'reporter', select: 'name username'}
    ]);
    res.status(200).json({task});
}

const updateTask = async (req, res) => {
    const {task, project} = await trovaTaskAccessibile(req.params.id, req.user);
    const updates = scegliChiavi(req.body, TASK_FIELDS);
    if ('assignee' in updates) await assertValidAssignee(project, update.assignee);

    Object.assign(task, updates);
    await task.save();
    res.status(200).json({task});
}

const deleteTask = async (req, res) => {
    const {task, project} = await trovaTaskAccessibile(req.params.id, req.user);
    const canDelete = isSameId(task.reporter, req.user._id) || isSameId(project.owner, req.user._id);
    if (!canDelete) throw new HttpError(403, 'Only the reporter or the project owner can delete the task');
    await task.deleteOne();
    res.status(200).json({msg: 'task deleted'});
}

module.exports = {
    getProjectTasks,
    createTask,
    getTask,
    updateTask,
    deleteTask 
};