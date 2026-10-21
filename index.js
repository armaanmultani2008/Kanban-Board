const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the server!');
});

const port = 5000;

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});