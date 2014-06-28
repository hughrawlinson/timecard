'use strict';

var express = require('express'),
    mongoose = require('mongoose'),
    APP_PORT = 8080;

mongoose.connect('mongodb://localhost/timecard', function(err) {
    if (err) {
        console.log('Connection to DB failed');
        throw err;
    };
});
var db = mongoose.connection;
db.once('open', function callback() {
    console.log('Connection open to local database');
});

var app = express();
app.set('title', 'Timecard');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.methodOverride());
app.use(express.static('public'));
app.use(function(req, res, next) {
    console.log('%s: %s %s', req.ip, req.method, req.path);
    next();
});

var shiftSchema = new mongoose.Schema({
    'startTime': Date,
    'endTime': Date
});

var shift = mongoose.model('shift', shiftSchema);

var timecard = function() {};

timecard.prototype = {
    'punchIn': function(app, res) {
        var s = new shift({
            startTime: Date.now(),
        });
        s.save(function(err, doc) {
            if (err) {
                console.log('Punch In Error: ', err);
                res.status(500);
                res.json({
                    'success': false,
                    'error': err
                });
            } else {
                console.log('Punch In: ', doc._id);
                res.json({
                    'success': true,
                    data: doc
                });
            }
        });
    },
    'punchOut': function(app, res, id) {
        shift.findByIdAndUpdate(id, {
            endTime: Date.now()
        }, function(err, doc) {
            if (err) {
                console.log('Punch Out Error: ', err);
                res.status(500);
                res.json({
                    'success': false,
                    'error': err
                });
            } else {
                console.log('Punch Out: ', doc._id);
                res.json({
                    'success': true,
                    data: doc
                });
            }
        });
    },
    'range': function(res,st,et){
        var startTime = '';
        var endTime = '';
        if(arguments.length===2){
            endTime = new Date();
        }
        else{
            endTime = new Date(et);
        }
        try{
            startTime = new Date(st);
        }
        catch(err){
            res.json({
                'success': false,
                'error': err
            });
        }
        shift.find({
            startTime:{
                $gte:startTime,
                $lt:endTime
            },
            endTime:{
                $gte:startTime,
                $lt:endTime
            }
        },function(err, doc){
            if(err){
                console.log('Range error');
                res.status(500);
                res.json({
                    'success': false,
                    'error': err
                });
            }
            else{
                console.log('Range: '+startTime+' - '+endTime);
                res.json({
                    'success': true,
                    'data': doc
                });
            }
        });
    }
};

var tc = new timecard();

app.get('/', function(req, res) {
    res.render('index', {
        'pageTitle': 'input',
        'text': 'test'
    });
});

app.get('/output', function(req, res) {
    res.render('output', {
        'pageTitle': 'output'
    });
});

app.put('/api/punchIn', function(req, res) {
    tc.punchIn(app, res);
});

app.get('/range/:st', function(req,res){
    tc.range(res, req.params.st);
});

app.get('/range/:st/:et', function(req,res){
    tc.range(res, req.params.st, req.params.et);
});

app.post('/api/punchOut/:id', function(req, res) {
    tc.punchOut(app, res, req.params.id);
});

app.listen(APP_PORT, function() {
    console.log('%s listening on port %s', app.get('title'), APP_PORT);
});