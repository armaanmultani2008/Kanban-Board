class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const errorHandler = (err, req, res, next) => {
    if (err instanceof HttpError)
        return res.status(err.status).json({ msg: err.message });
    if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    if (err.name === 'CastError')
        return res.status(400).json({ msg: `Invalid value for ${err.path}` });
    if (err.code === 11000) {
        return res.status(409).json({ msg: `Already in use: ${Object.keys(err.keyValue).join(', ')}` });
    }
    console.error(err);
    res.status(500).json({ msg: 'Something went wrong' });
};

module.exports = { HttpError, errorHandler};