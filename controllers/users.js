const User = require('../models/user');
const {HttpError, isSameId, scegliChiavi} = require('../utils/helpers');

const getCurrentUser = async (req, res) => {
    res.status(200).json({user: req.user});
}

const updateCurrentUser = async (req, res) => {
    const updates = scegliChiavi(req.body,
        ['name', 'username', 'job_title', 'biography']);
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true
    });
    res.status(200).json({user});
}

const getUser = async (req, res) => {
    const {id: userID} = req.params;
    const user = await User.findById(userID)
        .select('name username job_title biography team');
    if (!user) throw new HttpError(404, 'User not found');
    const visible = isSameId(user._id, req.user._id)
        || (req.user.team && isSameId(user.team, req.user.team));
    if (!visible) throw new HttpError(404, 'User not found');
    res.status(200).json({user});
}

module.exports = {
    getCurrentUser,
    updateCurrentUser,
    getUser
}