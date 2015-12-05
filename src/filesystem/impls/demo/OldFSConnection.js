// NEW 
// Include HTTP module
var http = require("http");
//Include fs module
var fs = require("fs");

var querystring = require('querystring');

// Create HTTP Server
http.createServer(function(request, response) {
    // Set CORS Header
    response.setHeader('Access-Control-Allow-Origin', 'http://ulkk6b05c55d.liongold.koding.io');
    response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Content-Type', 'application/json');
    //        if(request.) {
    //response.setHeader('Content-Type', 'application/json');
    //    }
    var result = "";
    if(request.method === "POST") {
        console.log("POST");
        var body = '';
        request.on('data', function (data) {
            body += data;
            console.log("Partial body: " + body);
        });
        request.on('end', function () {
                    //response.setHeader('Content-Type', 'text/html');
        //request.on("end", function() {
        //response.setHeader('Content-Length', Buffer.byteLength(result));
            var postData = querystring.parse(body);
            //console.log(postData);*/
            switch(action) {
                case "writeFile":
                    //console.log("write");
                    //var data = path.split("+")[1];
                    //options = path.split("+")[2];
                    var writepath = path.split("+")[0];
                    //var data = path.replace(writepath, "");
                    
                    //console.log(path);
                    //console.log(data);
                    //console.log(options);
                    result = fs.writeFile(path, postData.data, postData.options, callback);
                    break;
                case "readFile":
                    //console.log("readFile");
                    // options = path.split("+")[1];
                    //console.log(postData.options);
                    path = path.split("+")[0];
                    //console.log(path);
                    //postData.options.encoding = "utf-8";
                    result = fs.readFile(path, /*postData.*/options, callback);
                    break;
                case "mkdir":
                    //console.log("mkdir");
                    // mode = path.split("+")[1];
                    //path = path.split("+")[0];
                    result = fs.mkdir(postData.path, postData.mode, callback);
                    break;
                case "rename":
                    //console.log("reame");
                    //var oldPath = path.split("+")[0];
                    //var newPath = path.split("+")[1];
                    result = fs.rename(postData.oldPath, postData.newPath, callback);
                    break;
                case "getItems":
//                    console.log("getItems");
                    //var returned = [];
                    var filesArray = fs.readdirSync(/*postData.*/path);
                    //console.log(filesArray);
//                    console.log(postData.directoriesOnly);
                    if(postData.directoriesOnly === true) {
//                        console.log("driectories only");
                        filesArray = filesArray.filter(function(value) {
                            //console.log(value);
                            
                            //console.log(fs.realpathSync(path + value));
                            //console.log(fs.statSync(fs.realpathSync(path + value)));
                            return fs.statSync(fs.realpathSync(path + value)).isDirectory();
                        });
                    }
                    //console.log(filesArray);
                    for(var j = 0; j < filesArray.length; j++) {
                        returned.push({"name": filesArray[j], "path": fs.realpathSync(path + filesArray[j])});
                    }
//                    console.log(returned);
                    result = JSON.stringify(returned);
                    console.log("agyer JSON " + result);
                    //response.writeHead(200, {'Content-Type': 'text/html'});
                    //response.end("Hello");
                    //response.write("Hello");
                    //response.end();
                    response.write(JSON.stringify(returned));
                    break;
                default:
                    console.log("URL not valid (POST)");
                    break;
                //process.nextTick()
            }
        });
        //response.writeHead(200, {'Content-Type': 'text/html'});
        //response.setHeader('Content-Type', 'text/html');
        console.log("before end");
        console.log("Before end " + result);
        setTimeout(function() {
            console.log("in timeout");
            console.log(result);
            //response.end('result');
        }, 1000);
        //if(action === "getItems") {
        //    response.end(JSON.stringify(returned)); }
        //}else{
        //response.end('post received' /*result*/);
        //}
        response.end();
    }
    //Remove /api/ from every URL called
    var url = request.url;
    url = url.replace("/api/", "");
    var result;
    var callback = function(error, resulting) { console.log(error); console.log(resulting); };
    var options = {
        encoding: 'utf-8'
    };
    var post = function(result) {
        console.log("calback init");
        //response.setHeader('Content-Length', '500');
        response.end(result);
        console.log("callbakc closed");
    };
            //var path = url.split("/")[1];
        //console.log(url);
        //console.log(21);
        var action = url.split("/")[0];
        var path = url.replace(action + "/", "");
        if(path.substr(0, 1) === "/") {
            path = path.replace("/", "");
        }
        //console.log(action);
        //console.log(1);
        //console.log(path);
        //console.log("Starting directory: " + process.cwd());
        try {
            process.chdir("../../../../");
            //console.log("Changed directory to: " + process.cwd());
        }catch(e) {
            //console.log("Error");
            //console.log(e);
        }
    //if(request.method === "GET") {
    // Start attaching event listeners
    var queryData = "";
    var returned = [];
    request.on("data", function(data) {
        queryData += data;
        console.log(data);
    });
    request.on("end", function() {
        if(request.method === "GET") {
        //var path = url.split("/")[1];
/*        console.log(url);
        console.log(21);
        var action = url.split("/")[0];
        var path = url.replace(action + "/", "");
        if(path.substr(0, 1) === "/") {
            path = path.replace("/", "");
        }
        console.log(action);
        console.log(1);
        console.log(path);
        console.log("Starting directory: " + process.cwd());
        try {
            process.chdir("../../../../");
            console.log("Changed directory to: " + process.cwd());
        }catch(e) {
            console.log("Error");
            console.log(e);
        }*/
        //Check user requested URL 
       switch(action) {
            case "stat":
                //console.log("stat");
                result = fs.stat(path, callback);
                break;
            case "exists":
                //console.log("exists");
                result = fs.stat(path, function(error, stats) {
                    //console.log(error);
                    //console.log(stats);
                });
                break;
            case "readdir":
                //console.log("readdir");
                result = fs.readdir(path, callback);
                break;
/*            case "mkdir":
                console.log("mkdir");
                var mode = path.split("+")[1];
                path = path.split("+")[0];
                result = fs.mkdir(path, mode, callback);
                break;
            case "rename":
                console.log("reame");
                var oldPath = path.split("+")[0];
                newPath = path.split("+")[1];
                result = fs.rename(oldPath, newPath, callback);
                break;*/
/*            case "readFile":
                console.log("readFile");
                var options = path.split("+")[1];
                console.log(options);
                path = path.split("+")[0];
                console.log(path);
                result = fs.readFile(path, options, callback);
                break;*/
//            case "writeFile":
//                console.log("write");
                //var data = path.split("+")[1];
                //options = path.split("+")[2];
/*                var writepath = path.split("+")[0];
                var data = path.replace(writepath, "");
                console.log(path);
                console.log(data);
                console.log(options);
                result = fs.writeFile(path, data, options, callback);
                break;*/
            case "unlink":
                //console.log("unlink");
                result = fs.unlink(path, callback);
                break;
            //
            default:
                console.log("URL not valid");
                break;
            }
        //}
        //console.log(result);
        //return result;
    //});
        }
        //}else if(request.method === "POST") {
        //response.setHeader('Content-Type', 'text/html');
        //request.on("end", function() {
        //response.setHeader('Content-Length', Buffer.byteLength(result));
            /*var postData = querystring.parse(queryData);
            //console.log(postData);
            switch(action) {
                case "writeFile":
                    //console.log("write");
                    //var data = path.split("+")[1];
                    //options = path.split("+")[2];
                    var writepath = path.split("+")[0];
                    //var data = path.replace(writepath, "");
                    
                    //console.log(path);
                    //console.log(data);
                    //console.log(options);
                    result = fs.writeFile(path, postData.data, postData.options, callback);
                    break;
                case "readFile":
                    //console.log("readFile");
                    // options = path.split("+")[1];
                    //console.log(postData.options);
                    path = path.split("+")[0];
                    //console.log(path);
                    //postData.options.encoding = "utf-8";
                    result = fs.readFile(path, /*postData.*//*options, callback);
                    break;
                case "mkdir":
                    //console.log("mkdir");
                    // mode = path.split("+")[1];
                    //path = path.split("+")[0];
                    result = fs.mkdir(postData.path, postData.mode, callback);
                    break;
                case "rename":
                    //console.log("reame");
                    //var oldPath = path.split("+")[0];
                    //var newPath = path.split("+")[1];
                    result = fs.rename(postData.oldPath, postData.newPath, callback);
                    break;
                case "getItems":
//                    console.log("getItems");
                    //var returned = [];
                    var filesArray = fs.readdirSync(/*postData.*///path);
                    //console.log(filesArray);
//                    console.log(postData.directoriesOnly);
                    /*if(postData.directoriesOnly === true) {
//                        console.log("driectories only");
                        filesArray = filesArray.filter(function(value) {
                            //console.log(value);
                            
                            //console.log(fs.realpathSync(path + value));
                            //console.log(fs.statSync(fs.realpathSync(path + value)));
                            return fs.statSync(fs.realpathSync(path + value)).isDirectory();
                        });
                    }
                    //console.log(filesArray);
                    for(var j = 0; j < filesArray.length; j++) {
                        returned.push({"name": filesArray[j], "path": fs.realpathSync(path + filesArray[j])});
                    }
//                    console.log(returned);
                    result = JSON.stringify(returned);
//                    console.log(result);
                    //response.writeHead(200, {'Content-Type': 'text/html'});
                    //response.end("Hello");
                    //response.write("Hello");
                    //response.end();
                    break;
                default:
                    console.log("URL not valid (POST)");
                    break;
                //process.nextTick()
            }
            //response.end(result);
            console.log(1);
            //response.setHeader('Control-Type', 'application/json');
            //response.end(result);
            console.log(4);
            //response.end();
            //console.log(result);
            //return result;
        // });
        console.log(2);
        post(result);*/

        //}
        //console.log(5);
    });
    request.on("error", function(error) {
        console.log(error);
    });
    console.log(3);
    process.nextTick(function() {
    // Send data to browser
    console.log("Returned: " + result);
    response.end(result);
    });
}).listen(7681);
// END NEW

// This folder will be the "NodeJS file"
console.log("Hello World");

