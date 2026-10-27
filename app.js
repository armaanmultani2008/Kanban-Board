const express = require('express');
const app = express();
const connectDB = require('./db/connect');
const port = 8080;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Welcome to the server!');
});

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(process.env.PORT, () => {
            console.log(`Server is listening on port ${process.env.PORT}`)
        });
    } catch (err) {
        console.log(err);
    }
};

start();