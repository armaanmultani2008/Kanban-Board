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
        {path: 'reporter', select: 'name username'},
        {path: 'comments.author', select: 'name username'},
        {path: 'worklogs.author', select: 'name username'}
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

const addComment = async (req, res) => {
    const {task} = await trovaTaskAccessibile(req.params.id, req.user);
    task.comments.push({
        author: req.user._id,
        text: req.body.text,
        isIssue: req.body.isIssue === true
    });
    await task.save();
    res.status(201).json({comment: task.comments[task.comments.length - 1]});
};

const updateComment = async (req, res) => {
    const {task} = await trovaTaskAccessibile(req.params.id, req.user);
    const comment = task.comments.id(req.params.commentId);
    if (!comment) throw new HttpError(404, 'Comment not found');

    if (req.body.text !== undefined) {
        if (!isSameId(comment.author, req.user._id)) {
            throw new HttpError(403, 'Only the author can edit the comment');
        }
        comment.text = req.body.text;
    }
    if (req.body.resolved !== undefined) {
        if (!comment.isIssue) throw new HttpError(400, 'Only issues can be resolved');
        comment.resolved = req.body.resolved;
    }

    await task.save();
    res.status(200).json({comment});
};

const deleteComment = async (req, res) => {
    const {task, project} = await trovaTaskAccessibile(req.params.id, req.user);
    const comment = task.comments.id(req.params.commentId);
    if (!comment) throw new HttpError(404, 'Comment not found');

    const canDelete = isSameId(comment.author, req.user._id) || isSameId(project.owner, req.user._id);
    if (!canDelete) throw new HttpError(403, 'Only the author or the project owner can delete the comment');

    task.comments.pull(comment._id);
    await task.save();
    res.status(200).json({msg: 'Comment deleted'});
};

const addWorklog = async (req, res) => {
    const {task} = await trovaTaskAccessibile(req.params.id, req.user);
    task.worklogs.push({author: req.user._id, text: req.body.text});
    await task.save();
    res.status(201).json({worklog: task.worklogs[task.worklogs.length - 1]});
};

const deleteWorklog = async (req, res) => {
    const {task} = await trovaTaskAccessibile(req.params.id, req.user);
    const worklog = task.worklogs.id(req.params.worklogId);
    if (!worklog) throw new HttpError(404, 'Worklog not found');
    if (!isSameId(worklog.author, req.user._id)) {
        throw new HttpError(403, 'Only the author can delete the worklog');
    }

    task.worklogs.pull(worklog._id);
    await task.save();
    res.status(200).json({msg: 'Worklog deleted'});
};

module.exports = {
    getProjectTasks,
    createTask,
    getTask,
    updateTask,
    deleteTask,
    addComment,
    updateComment,
    deleteComment,
    addWorklog,
    deleteWorklog
};