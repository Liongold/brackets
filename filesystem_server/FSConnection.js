//Include Dependencies
var http = require('http');
var fs = require('fs');
var queryString = require('querystring');
var url = require('url');

//Define Required Variables
var action, command, path, method, parameters, requestPath, formBody = "", events = [], parsedPostData;
var options = {
    'encoding': 'utf-8'
};
var installUrl = "/brackets/dist/";

//Start up HTTP server
http.createServer(function(request, response) {

    //Set Required Headers
    response.setHeader('Access-Control-Allow-Origin', /*'http://ulkk6b05c55d.liongold.koding.io'*/ 'http://brackets-on-vm-liongold.c9users.io');
    response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Content-Type', 'application/json');
    
    //sendResponse function
    var sendResponse = function(errors, result) {
        if(errors) { 
            console.log(errors); 
            if(typeof errors !== "string") {
                response.end(JSON.stringify(errors));
            }
        }
        
        if(!result) {
            result = {};
        }
        
        if(typeof result !== "string") {
            response.end(JSON.stringify(result));
        }
    };
    
    //getAction function
    var getAction = function(path, requestMethod, fullURL, postData) {
        
        command = path.split("/")[0];
        path = path.replace(command + "/", "");
        if(!path) {
            path = "/home/liongold";
        }
        
        if(requestMethod === "GET") {
            
            parameters = url.parse(fullURL);
        
        }else{
            
            parsedPostData = queryString.parse(postData);
            
        }
        
        if(path.substring(0, installUrl.length) === installUrl) {
            //path = "/home/liongold/Web" + path;
            console.log(path);
            path = "/home/ubuntu/workspace" + path;
        }
        
        switch (command) {
            case 'writeFile':
                fs.writeFile(path, parsedPostData.data, options, sendResponse);
                break;
            
            case 'readFile':
                fs.readFile(path, options, function(errors, contents) {
                    fs.stat(path, function(errors, statistics) {
                        var returned = {
                            "contents": contents,
                            "isFile": statistics.isFile(),
                            "hash": statistics.mtime.getTime()
                        };
                        sendResponse(errors, returned);
                    });
                });
                break;
            
            case 'mkdir':
                fs.mkdir(path, parameters.mode, sendResponse);
                break;
                
            case 'rename':
                fs.rename(path, postData.newPath, sendResponse);
                break;
                
            case 'getItems':
                var returned = [];
                var filesArray;
                fs.readdir(path, function(error, files) {
                    filesArray = files;
                    if(parsedPostData.directoriesOnly === "true") {
                        filesArray = filesArray.filter(function(value) {
                            return fs.statSync(fs.realpathSync(path + "/" + value)).isDirectory();
                        });
                    }
                    if(filesArray.length > 0) {
                        filesArray.forEach(function(file, i) {
                            try {
                                process.chdir(path);
                            }catch(e) {
                                console.log("Error" + e);
                            }
                            fs.realpath(file, function(errors, fullPath) {
                                fs.stat(file, function(errors, statistics) {
                                    returned.push(
                                        {
                                            "name": file,
                                            "fullPath": fullPath,
                                            "isDirectory": statistics.isDirectory(),
                                            "type": (statistics.isDirectory() ? "directory" : "file")
                                        }
                                    );
                                    
                                    if(i === (filesArray.length - 1)) {
                                        sendResponse(null, returned);
                                    }
                                });
    
                            });
                        });
                    }else{
                        sendResponse(null, []);
                    }
                });
                break;
                
            case 'stat':
                fs.stat(path, function(errors, statistics) {
                    if(errors) {
                        console.log("Stat error " + errors);
                        sendResponse(errors, []);
                    }else{
                        statistics.isFile = statistics.isFile();
                        statistics.hash = statistics.mtime.getTime();
                        sendResponse(errors, statistics);
                    }
                });                
                break;
                
            case 'exists':
                fs.stat(path, function(errors, statistics) {
                    if(errors && errors.errno == /*34*/-2) {
                        sendResponse(null, { "exists": false });
                    }else if(errors) {
                        sendResponse(errors);
                    }else{
                        sendResponse(null, { "exists": true });
                    }
                });
                break;
                
            case 'readdir':
                fs.readdir(path, function(errors, contents) {
                    if(!errors) {
                        fs.stat(path, function(errors, statistics) {
                            contents.isFile = statistics.isFile();
                            contents.hash = statistics.mtime.getTime();
                            sendResponse(errors, contents);
                        });
                    }else{
                        sendResponse(errors, contents);
                    }
                });
                break;
                
            case 'unlink':
                fs.unlink(path, sendResponse);
                break;
            
            case 'watch':
                fs.stat(path, function(errors, statistics) {
                    if(errors && errors.errno == 34) {
                        sendResponse(null, { "exists": false });
                    }else{
                        fs.watch(path, function(event, filename) {
                            events.push({
                                    'event': event,
                                    'timestamp': Date.now(),
                                    'filename': filename,
                                    'path': path
                            });
                            console.log("Watcher event " + events);
                        });                  
                    }
                });
                /*fs.watch(path, function(event, filename) {
                    events.push({
                            'event': event,
                            'timestamp': Date.now(),
                            'filename': filename,
                            'path': path
                    });
                    console.log(events);
                });*/
                break;
                
            case 'watcherCheck':
                var reply;
                for(var i = 0; i < events.length; i++) {
                    if(events[i].path === path) {
                        reply.push({
                            "path": path, 
                            "event": events[i].event, 
                            "filename": events[i].filename
                        });
                    }
                    if(i == (events.length - 1)) {
                        sendResponse(null, reply);
                        return;
                    }
                    console.log("Watcher Check Reply " + reply);
                }
                sendResponse({});
                break;
                
            case 'ping':
                sendResponse([], { 'status': true });
                break;
                
            default:
                console.log("Command Not Valid");
                break;
        }
        
    };

    request.on('data', function(data) {
        formBody += data;
    });
    
    request.on('end', function() {
        
        requestPath = request.url;
        requestPath = requestPath.replace("/api/", "");
        path = requestPath.split("?")[0];
        method = request.method;
        action = getAction(path, method, request.url, formBody);
        formBody = "";
    });
    

}).listen(/*7681*/8081);