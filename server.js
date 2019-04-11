var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [{
    id: 1,
    description: 'coco',
    completed: false
}, {
    id: 2,
    description: 'nyapu',
    completed: false
}, {
    id: 3,
    description: 'ngepel',
    completed: true
}];

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
})

app.listen(PORT, function () {
    console.log(`Express listeing on port ${PORT}!`);
});