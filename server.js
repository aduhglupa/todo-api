var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('TODO API ROOT');
});

app.get('/todos', function (req, res) {
    res.json(todos);
});

app.get('/todos/:id', function (req, res) {
    var todoId = +req.params.id;
    var todo = todos.find(element => {
        return element.id === todoId;
    });
    if (todo) {
        res.json(todo);
    }
    res.status(404).send();
});

app.post('/todos', function (req, res) {
    var body = req.body;
    body.id = todoNextId++;

    todos.push(body);

    res.json(body);
});

app.listen(PORT, function () {
    console.log(`Express listeing on port ${PORT}!`);
});