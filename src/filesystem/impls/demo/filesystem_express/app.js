var express = require('express');
var app = express();
var result;
var fs = require('fs');
var bodyParser = require('body-parser');
var callback = function(error, resulting) {
    console.log(error);
    console.log(resulting);
};
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req,res,next) { req.url = req.url.replace(/[/]+/g, '/'); next(); });
var router = express.Router();
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});
router.get('/stat//:path', function(request, response) {
    result = fs.stat(request.params.path, function(error, stats) {
        console.log(error);
        response.send(stats);
        response.end();
    });
});
router.get('/exists//:path', function(request, response) {
    result = fs.stat(request.params.path, function(error, result) {
        console.log(error);
        response.send(result);
        response.end();
    });
});
router.get('/readdir//:path', function(request, response) {
    result = fs.readdir(request.params.path, function(error, result) {
        console.log(error);
        response.send(result);
        response.end();
    });
});
router.get('/unlink//:path', function(request, response) {
    result = fs.unlink(request.params.path, function(error, result) {
        console.log(error);
        response.send(result);
        response.end();
    });
});
router.post('/writeFile//:path', function(request, response) {
    response.send("Hello");
    response.end();
});
router.post('/readFile//:path', function(request, response) {
    response.send("Hello");
    response.end();
});
router.post('/mkdir//:path', function(request, response) {
    response.send("Hello");
    response.end();
});
router.post('/rename//:path', function(request, response) {
    response.send("Hello");
    response.end();
});
router.post('/getItems//:path', function(request, response) {
    response.send("Hello");
    response.end();
});
app.use(function(request, response, next) {
    // Set CORS Header
    response.setHeader('Access-Control-Allow-Origin', 'http://ulkk6b05c55d.liongold.koding.io');
    response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    //response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    //response.setHeader('Content-Type', 'application/json');
    next();
});
app.use('/api', router);
var server = app.listen(7681, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Hello World');
});