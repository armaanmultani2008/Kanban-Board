const jwt = require('jsonwebtoken');
const User = require('../models/user');
const {HttpError} = require('../utils/helpers');

const auth = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) throw new HttpError(401, 'Authentication required');

    let payload;
    try {
        payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch {
        throw new HttpError(401, 'Invalid or expired token');
    }

    const user = await User.findById(payload.id);
    if (!user) throw new HttpError(401, 'User no longer exists');
    req.user = user;
    next();
};

module.exports = auth;