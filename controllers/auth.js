const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const {HttpError} = require('../utils/helpers');

const signToken = (user) =>
    jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES || '7d'});

const register = async (req, res) => {
    const {name, username, email, password} = req.body;
    if (typeof password !== 'string' || password.length < 8) {
        throw new HttpError(400, 'password must be at least 8 characters long');
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({name, username, email, password: hashed});
    res.status(201).json({
        user: { id: user._id, name: user.name, username: user.username, email: user.email },
        token: signToken(user),
    });
};

const login = async (req, res) => {
    const {username, password} = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
        throw new HttpError(400, 'must provide username and password');
    }
    const user = await User.findOne({username}).select('+password');
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) throw new HttpError(401, 'Invalid credentials');
    res.status(200).json({
        user: {id: user._id, name: user.name, username: user.username},
        token: signToken(user),
    });
};

module.exports = {
    register, 
    login
};