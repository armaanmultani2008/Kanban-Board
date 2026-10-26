const express = require('express');
const app = express();
const port = 8080;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Welcome to the server!');
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});