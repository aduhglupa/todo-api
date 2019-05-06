var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('TODO API ROOT');
});

app.get('/todos', function (req, res) {
    var query = req.query;
    var where = {};

    if (query.hasOwnProperty('completed') && query.completed === 'true') {
        where.completed = true;
    } else if (query.hasOwnProperty('completed') && query.completed === 'false') {
        where.completed = false;
    }

    if (query.hasOwnProperty('q') && _.isString(query.q) && query.q.trim().length > 0) {
        where.description = {
            $like: `%${query.q}%`
        };
    }

    db.todo
        .findAll({
            where: where
        })
        .then(function (todos) {
            res.json(todos);
        }, function (e) {
            res.status(500).send();
        });
});

app.get('/todos/:id', function (req, res) {
    var todoId = +req.params.id;

    db.todo.findById(todoId)
        .then(function (todo) {
            if (!!todo) {
                res.json(todo.toJSON());
            } else {
                res.status(404).send();
            }
        }, function (e) {
            res.status(500).send();
        });

    // var matchedTodo = _.findWhere(todos, {id: todoId});
    // if (matchedTodo) {
    //     res.json(matchedTodo);
    // }
    // res.status(404).send();
});

app.post('/todos', function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    db.todo.create(body)
        .then(function (todo) {
            res.json(todo.toJSON());
        }, function (e) {
            res.status(400).json(e);
        });

    // if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
    //     return res.status(400).send();
    // }
    
    // body.description = body.description.trim();
    // body.id = todoNextId++;

    // todos.push(body);

    // res.json(body);
});

app.delete('/todos/:id', function (req, res) {
    var todoId = +req.params.id;

    db.todo
        .destroy({
            where: {
                id: todoId
            }
        })
        .then(function (rowsDeleted) {
            if (rowsDeleted === 0) {
                res.status(404).json({ error: 'There is no todos with that id' });
            } else {
                res.status(204).send();
            }
        }, function (e) {
            res.status(500).send();
        });
});

app.put('/todos/:id', function (req, res) {
    var todoId = +req.params.id;
    var matchedTodo = _.findWhere(todos, {id: todoId});
    var body = _.pick(req.body, 'description', 'completed');
    var validAttribute = {};

    if (!matchedTodo) {
        return res.status(404).send();
    }

    if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
        validAttribute.completed = body.completed;
    } else if (body.hasOwnProperty('completed')) {
        return res.status(400).send();
    }

    if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
        validAttribute.description = body.description;
    } else if (body.hasOwnProperty('description')) {
        return res.status(400).send();
    }

    _.extend(matchedTodo, validAttribute);
    res.json(matchedTodo);
});

db.sequelize.sync()
    .then(function () {
        app.listen(PORT, function () {
            console.log(`Express listeing on port ${PORT}!`);
        });
    });