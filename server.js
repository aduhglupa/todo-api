var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');

var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('TODO API ROOT');
});

app.get('/todos', middleware.requireAuthentication, function (req, res) {
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

app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
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

app.post('/todos', middleware.requireAuthentication, function (req, res) {
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

app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
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

app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = +req.params.id;
    var body = _.pick(req.body, 'description', 'completed');
    var attributes = {};

    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    }

    if (body.hasOwnProperty('description')) {
        attributes.description = body.description;
    }

    db.todo.findById(todoId)
        .then(function (todo) {
            if (todo) {
                todo.update(attributes)
                    .then(function (todo) {
                        res.json(todo.toJSON());
                    }, function (e) {
                        res.status(400).json(e);
                    });
            } else {
                res.status(404).send();
            }
        }, function () {
            res.status(500).send();
        });
});

app.post('/users', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');

    db.user.create(body)
        .then(function (user) {
            res.json(user.toPublicJSON());
        }, function (e) {
            res.status(400).json(e);
        });
});

app.post('/users/login', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');

    db.user.authenticate(body)
        .then(function (user) {
            var token = user.generateToken('authentication');
            
            if (token) {
                res.header('Auth', token).json(user.toPublicJSON());
            } else {
                res.status(401).send();
            }
        }, function () {
            res.status(401).send();
        });
});

db.sequelize.sync({force: true})
    .then(function () {
        app.listen(PORT, function () {
            console.log(`Express listeing on port ${PORT}!`);
        });
    });