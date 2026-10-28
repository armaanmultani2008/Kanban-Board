const User = require('../models/user');
const {HttpError, isSameId, scegliChiavi} = require('../utils/helpers');

const getCurrentUser = async (req, res) => {
    res.status(200).json({user: req.user});
}

const updateCurrentUser = async (req, res) => {
    const updates = scegliChiavi(req.body,
        ['name', 'username', 'job_title', 'biography']);
    const user = await User.finByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true
    });
    res.status(200).json({user});
}

const getUser = async (req, res) => {
    const {id: userID} = req.params;
    const user = await findById(userID)
        .select('name username job_title biography team');
    const visible = user && (isSameId(userID, req.user._id)) || (isSameId(user.team, req.user.team));
    res.status(200).json({user});
}

module.exports = {
    getCurrentUser,
    updateCurrentUser,
    getUser
}