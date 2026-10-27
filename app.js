const express = require('express');
const app = express();
const connectDB = require('./db/connect');
require('dotenv').config();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const teamRoutes = require('./routes/teams');
const taskRoutes = require('./routes/tasks');

app.use('/api/v1/auth', authRoutes);
app.use('api/v1/users', userRoutes);
app.use('api/v1/teams', teamRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    } catch (error) {
        console.log(error);
    }
};
start();