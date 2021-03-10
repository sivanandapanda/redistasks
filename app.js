var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var redis = require('redis');

var app = express();

var client = redis.createClient();
client.on('connect', function() {
    console.log('Redis server is connected.');
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    var title = 'Task List';

    client.lrange('tasks', 0, -1, function(err, reply) {
        client.hgetall('call', function(err, call){
            res.render('index', {
                title: title,
                tasks: reply,
                call: call
            });          
        });
    });    
});

app.post('/task/add', function(req, res){
    var task = req.body.task;
    client.rpush('tasks', task, function(err, reply){
        if(err) {
            console.err(err);
        } 
        console.log('Task Added...');
        res.redirect('/');
    });
});

app.post('/task/delete', function(req, res){
    var tasksToDel = req.body.tasks;
    client.lrange('tasks', 0, -1, function(err, tasks){
        for(var i = 0; i < tasks.length;i++) {
            if(tasksToDel.indexOf(tasks[i]) > -1) {
                client.lrem('tasks', 0, tasks[i], function(){
                    if(err) {
                        console.err(err);
                    }
                })
            }
        }
        res.redirect('/');
    });
});

app.post('/call/add', function(req, res){
    var tasksToDel = req.body.tasks;
    var newCall = {};

    newCall.name = req.body.name;
    newCall.company = req.body.company;
    newCall.phone = req.body.phone;
    newCall.time = req.body.time;

    client.hmset('call', ['name', newCall.name, 'company', newCall.company, 'phone', newCall.phone, 'time', newCall.time], function(err, reply){
        if(err) {
            console.err(err);
        }
        console.log(reply);
        res.redirect('/');
    });
});

app.listen(3000);
console.log('Server started at port 3000');

module.exports = app;