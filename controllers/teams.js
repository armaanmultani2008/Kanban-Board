const crypto = require('crypto');
const Team = require('../models/team');
const User = require('../models/user');
const Project = require('../models/project');
const {isSameId, scegliChiavi} = require('../utils/helpers');
const {HttpError} = require('../middleware/error-handler');

const findTeamAsAdmin = async (teamID, user) => {
    const team = await Team.findById(teamID);
    if (!team) throw new HttpError(404, 'Team not found');
    if (!isSameId(team.admin, user._id)) throw new HttpError(403, 'Only the team admin can do this');
    return team;
}

const createTeam = async (req, res) => {
    if (req.user.team) throw new HttpError(400, 'You already belong to a team');
    const team = await Team.create({
        ...scegliChiavi(req.body, ['name', 'description', 'goal']),
        admin: req.user._id,
        members: [req.user._id],
        inviteCode: crypto.randomBytes(4).toString('hex')
    });
    await User.updateOne({_id: req.user._id}, {team: team._id});
    res.status(201).json({team});
}

const getTeam = async (req, res) => {
    const { id: teamID } = req.params;
    if (!isSameId(req.user.team, teamID)) throw new HttpError(403, 'You are not part of this team');
    const team = await Team.findById(teamID);
    if (!team) throw new HttpError(404, 'Team not found');
    res.status(200).json({team});
}

const updateTeam = async (req, res) => {
    const team = await findTeamAsAdmin(req.params.id, req.user);
    Object.assign(team, scegliChiavi(req.body, ['name', 'description', 'goal']));
    await team.save();
    res.status(200).json({team});
}

const deleteTeam = async (req, res) => {
    const team = await findTeamAsAdmin(req.params.id, req.user);
    await User.updateMany({team: team._id}, {team: null});
    await Project.updateMany({team: team._id}, {team: null});
    await team.deleteOne();
    res.status(200).json({msg: 'Team deleted'});
}

const getMembers = async (req, res) => {
    const { id: teamID } = req.params;
    if (!isSameId(req.user.team, teamID)) throw new HttpError(403, 'You are not part of this team');
    const team = await Team.findById(teamID)
        .select('members admin')
        .populate('members', 'name username job_title');
    if (!team) throw new HttpError(404, 'Team not found');
    res.status(200).json({admin: team.admin, members: team.members});
}

const deleteMember = async (req, res) => {
    const {teamId, userId} = req.params;
    const team = await Team.findById(teamId);
    if (!team) throw new HttpError(404, 'Team not found');

    const isSelf = isSameId(req.user._id, userId);
    const isAdmin = isSameId(team.admin, req.user._id);
    if (!isSelf && !isAdmin) throw new HttpError(403, 'Only the admin can remove other members');
    if (isSameId(team.admin, userId)) {
        throw new HttpError(400, 'The admin can not leave: delete the team instead');
    }
    if (!team.members.some((m) => isSameId(m, userId))) throw new HttpError(404, 'Member not found');

    await Team.updateOne({_id: teamId}, {$pull: {members: userId}});
    await User.updateOne({_id: userId}, {team: null});
    res.status(200).json({msg: 'Member removed'});
}

const joinTeam = async (req, res) => {
    const { inviteCode } = req.body;
    if (typeof inviteCode !== 'string') throw new HttpError(400, 'must provide an invite code');
    if (req.user.team) throw new HttpError(400, 'You already belong to a team');

    const team = await Team.findOneAndUpdate(
        {inviteCode},
        {$addToSet: {members: req.user._id}},
        {new: true}
    );
    if (!team) throw new HttpError(404, 'Invalid invite code');
    await User.updateOne({_id: req.user._id}, {team: team._id});
    res.status(200).json({team});
}

module.exports = {
    createTeam,
    getTeam,
    updateTeam,
    deleteTeam,
    getMembers,
    deleteMember,
    joinTeam
}