const Project = require('../models/project');
const Task = require('../models/task');
const {HttpError, isSameId, scegliChiavi, trovaProjectAccessibile} = require('../utils/helpers');

const PROJECT_FIELDS = ['title', 'description', 'goal', 'status'];

const getProjects = async (req, res) => {
    const visibleTo = [{owner: req.user._id}];
    if (req.user.team) visibleTo.push({team: req.user.team});

    const filter = { $or: visibleTo };
    if (typeof req.query.status === 'string') filter.status = req.query.status;

    const projects = await Project.find(filter).sort('-createdAt');
    res.status(200).json({count: projects.length, projects});
};

const createProject = async (req, res) => {
    const project = await Project.create({
        ...scegliChiavi(req.body, PROJECT_FIELDS),
        owner: req.user._id,
        team: req.user.team || undefined,
    });
    res.status(201).json({project});
};

const getProject = async (req, res) => {
    const project = await trovaProjectAccessibile(req.params.id, req.user);
    res.status(200).json({project});
};

const updateProject = async (req, res) => {
    const project = await trovaProjectAccessibile(req.params.id, req.user);
    if (!isSameId(project.owner, req.user._id)) throw new HttpError(403, 'Only the owner can edit the project');
    Object.assign(project, scegliChiavi(req.body, PROJECT_FIELDS));
    await project.save();
    res.status(200).json({project});
};

const deleteProject = async (req, res) => {
    const project = await trovaProjectAccessibile(req.params.id, req.user);
    if (!isSameId(project.owner, req.user._id)) throw new HttpError(403, 'Only the owner can delete the project');
    await Task.deleteMany({project: project._id});
    await project.deleteOne();
    res.status(200).json({msg: 'Project deleted'});
};

module.exports = { 
    getProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject
};