/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, window, PathUtils */

define(function (require, exports, module) {
    "use strict";
    
    var FileSystemError = require("filesystem/FileSystemError"),
        FileSystemStats = require("filesystem/FileSystemStats"); //,
    var AjaxFileSystem  = require("filesystem/impls/demo/AjaxFileSystem");
    var Dialogs         = require("widgets/Dialogs");
    var DefaultDialogs  = require("widgets/DefaultDialogs");
    var FileUtils       = require("file/FileUtils");
    //var FileWatcher     = require("filesystem/impls/demo/FileWatcherDomain");
        //NodeFileSystem = require("filesystem/impls/demo/NodeFileSystem");
    
    
    var result;
    var statsResult;
    var interval = [];
    // Brackets uses FileSystem to read from various internal paths that are not in the user's project storage. We
    // redirect core-extension access to a simple $.ajax() to read from the source code location we're running from,
    // and for now we ignore we possibility of user-installable extensions or persistent user preferences.
    var CORE_EXTENSIONS_PREFIX = PathUtils.directory(window.location.href) + "extensions/default/";
//    var USER_EXTENSIONS_PREFIX = "/.brackets.user.extensions$/";
//    var CONFIG_PREFIX = "/.$brackets.config$/";
    
    
    // Static, hardcoded file tree structure to serve up. Key is entry name, and value is either:
    //  - string = file
    //  - object = nested folder containing more entries
    /*var demoContent = {
        "index.html": "<html>\n<head>\n    <title>Hello, world!</title>\n</head>\n<body>\n    Welcome to Brackets!\n</body>\n</html>",
        "main.css": ".hello {\n    content: 'world!';\n}",
        "main.js": "function sayHello() {\n    console.log('Hello, world!');\n}"
    };*/
    
    
    function _startsWith(path, prefix) {
        return (path.substr(0, prefix.length) === prefix);
    }
    
    function _stripTrailingSlash(path) {
        return path[path.length - 1] === "/" ? path.substr(0, path.length - 1) : path;
    }
    
    //Copied from master branch AppshellFileSystem.js
    /**
     * Convert appshell error codes to FileSystemError values.
     * 
     * @param {?number} err An appshell error code
     * @return {?string} A FileSystemError string, or null if there was no error code.
     * @private
     */
    function _mapError(err) {
        if (!err) {
            return null;
        }
        
        switch (err) {
            case /*appshell.fs.ERR_INVALID_PARAMS*/18:
                return FileSystemError.INVALID_PARAMS;
            case /*appshell.fs.ERR_NOT_FOUND*/34:
                return FileSystemError.NOT_FOUND;
            case /*appshell.fs.ERR_CANT_READ*/3:
                return FileSystemError.NOT_READABLE;
            case appshell.fs.ERR_CANT_WRITE:
                return FileSystemError.NOT_WRITABLE;
            case /*appshell.fs.ERR_UNSUPPORTED_ENCODING*/46:
                return FileSystemError.UNSUPPORTED_ENCODING;
            case /*appshell.fs.ERR_OUT_OF_SPACE*/54:
                return FileSystemError.OUT_OF_SPACE;
            case /*appshell.fs.ERR_FILE_EXISTS*/47:
                return FileSystemError.ALREADY_EXISTS;
        }
        return FileSystemError.UNKNOWN;
    }
    
    /**
     * Convert a callback to one that transforms its first parameter from an
     * appshell error code to a FileSystemError string.
     * 
     * @param {function(?number)} cb A callback that expects an appshell error code
     * @return {function(?string)} A callback that expects a FileSystemError string
     * @private
     */
    function _wrap(cb) {
        return function (err) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = _mapError(args[0]);
            cb.apply(null, args);
        };
    }
    
    /*function _getDemoData(fullPath) {
        var prefix = "/Getting Started/";
        if (fullPath.substr(0, prefix.length) !== prefix) {
            return null;
        }
        var suffix = _stripTrailingSlash(fullPath.substr(prefix.length));
        if (!suffix) {
            return demoContent;
        }
        
        var segments = suffix.split("/");
        var dir = demoContent;
        var i;
        for (i = 0; i < segments.length; i++) {
            if (!dir) { return null; }
            dir = dir[segments[i]];
        }
        return dir;
    }*/
    
    /*function _makeStat(demoData) {
        var options = {
            isFile: typeof demoData === "string",
            mtime: new Date(0),
            hash: 0
        };
        if (options.isFile) {
            options.size = demoData.length;
        }
        return new FileSystemStats(options);
    }*/
    /*function _nameFromPath(path) {
        var segments = _stripTrailingSlash(path).split("/");
        return segments[segments.length - 1];
    }*/
    
    
    function stat(path, callback) {
        /*if (_startsWith(path, CORE_EXTENSIONS_PREFIX)) {
            AjaxFileSystem.stat(path, callback);
            return;
        }
        
        var result = _getDemoData(path);
        if (result || result === "") {
            callback(null, _makeStat(result));
        } else {
            callback(FileSystemError.NOT_FOUND);
        }*/
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/stat/" + path, { dataType: "text"}).done(function(data) {
            result = JSON.parse(data);
            if(result.errno) {
                callback(_mapError(result.errno));
            }else{
                var options = {
                    isFile: result.isFile,
                    mtime: result.mtime,
                    size: result.size,
                    realPath: result.realPath,
                    hash: result.hash
                };
                var fileStats = new FileSystemStats(options);
                
                callback(null, fileStats);
            }
        });
    }
    
    function exists(path, callback) {
        /*stat(path, function (err) {
            if (err) {
                callback(null, false);
            } else {
                callback(null, true);
            }
        });*/
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/exists/" + path, { dataType: "text"}).done(function(data) {
            result = JSON.parse(data);
            /*if(result.exists) {
                callback(null, false);
            }else if(result.errno) {
                callback(result);
            }else{
                callback(null, true);
            }*/
            if(result.errno == 34) {
                callback(null, false);
            }else if(result.exists) {
                callback(null, true);
            }else{
                callback(_mapError(result.errono));
            }
        });    
        
    }
    
    function readdir(path, callback) {
        /*if (_startsWith(path, CORE_EXTENSIONS_PREFIX)) {
            callback("Directory listing unavailable: " + path);
            return;
        }
        
        var storeData = _getDemoData(path);
        if (!storeData) {
            callback(FileSystemError.NOT_FOUND);
        } else if (typeof storeData === "string") {
            callback(FileSystemError.INVALID_PARAMS);
        } else {
            var names = Object.keys(storeData);
            var stats = [];
            names.forEach(function (name) {
                stats.push(_makeStat(storeData[name]));
            });
            callback(null, names, stats);
        }*/
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/readdir/" + path, { dataType: "text"}).done(function(data) {
            result = JSON.parse(data);
            if(result.errno) {
                callback(_mapError(result.errno));
                return;
            }
            var count = result./*contents.*/length;
            if(!count) {
                callback(null, [], [], []);
                return;
            }
            var stats = [];
            result./*contents.*/forEach(function(value, index) {
                $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/stat/" + path + "/" + value, {dataType:"text"}).done(function(data) {
                    statsResult = JSON.parse(data);
                    stats[index] =  statsResult.errno || statsResult;
                    count--;
                    if(count <= 0) {
                        callback(null, result/*.contents*/, stats);
                    }
                });
            });
        });
    }
    
    function mkdir(path, mode, callback) {
        //callback("Cannot modify folders on HTTP demo server");
        if(typeof mode === "function") {
            callback = mode;
            mode = parseInt("0755", 8);
        }
        var dataString = "path=" + path + "&mode=" + mode;
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/mkdir/"/* + path + "+" + mode*/, { dataType: "text", type: "POST", data: dataString}).done(function(data) {
            result = JSON.parse(data);
            if(result.errno) {
                callback(_mapError(result.errno));
            }else{
                $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/stat/" + path, { dataType: "text"}).done(function(data) {
                    statsResult = JSON.parse(data);
                    if(statsResult.errno) {
                        callback(statsResult, []);
                    }else{
                        callback([], statsResult);
                    }
                });
            }
        });
    }
    
    function rename(oldPath, newPath, callback) {
        //callback("Cannot modify files on HTTP demo server");
        var dataString = "oldPath=" + oldPath + "&newPath=" + newPath;
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/rename/"/* + oldPath + "+" + newPath*/, { dataType: "text", type: "POST", data: dataString}).done(function(data) {
            alert(data);
        });
    }
    
    function readFile(path, options, callback) {
        console.log("Reading 'file': " + path);
        var encoding = options.encoding || "utf-8";
        // callback to be executed when the call to stat completes
        //  or immediately if a stat object was passed as an argument
        function doReadFile(statsResult) {
            if (statsResult.size > (FileUtils.MAX_FILE_SIZE)) {
                callback(FileSystemError.EXCEEDS_MAX_FILE_SIZE);
            } else {
                //appshell.fs.readFile(path, encoding, function (_err, _data) {
                options = $.param(options);
                var dataString = "options=" + JSON.stringify(options);
                $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/readFile/" + path/* + "+" + options*/, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
                    result = JSON.parse(data);
                    if (result.errno) {
                        callback(_mapError(result.errno));
                    } else {
                        callback(null, result.contents, statsResult);
                    }
                });
                //});
            }
        }

        if (path === "/$.brackets.config$/brackets.json" || path === "/$.brackets.config$/state.json") {
            console.log("using Ajaxfilesystem");
            //AjaxFileSystem.readFile(path, callback);
            callback(FileSystemError.UNKNOWN);
        //if (!(_startsWith(path, CORE_EXTENSIONS_PREFIX))) {
            //AjaxFileSystem.readFile(path, callback);
            return;
        //}
        
            
        }
        //if(path)
        
        /*var storeData = _getDemoData(path);
        if (!storeData && storeData !== "") {
            callback(FileSystemError.NOT_FOUND);
        } else if (typeof storeData !== "string") {
            callback(FileSystemError.INVALID_PARAMS);
        } else {
            var name = _nameFromPath(path);
            callback(null, storeData, _makeStat(storeData[name]));
        }*/
        /*options = $.param(options);
        var dataString = "options=" + JSON.stringify(options);
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/readFile/" + path/* + "+" + options*///, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
            /*alert(data);
            callback(FileSystemError.UNKNOWN);
        });*/
        //callback(FileSystemError.NOT_FOUND);
        if(options.stat) {
            doReadFile(options.stat);
        }else{
            exports.stat(path, function (_err, _stat) {
                if (_err) {
                    callback(_err);
                } else {
                    doReadFile(_stat);
                }
            });
        }
    }
    
    
    function writeFile(path, data, options, callback) {
        //callback("Cannot save to HTTP demo server");
        /*options = $.param(options);
        var dataString = "data=" + encodeURIComponent(data) + "&options=" + JSON.strigify(options);
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/writeFile/" + path/* + "+" + data + "+" + options*//*, { dataType: "text", type: "POST", data: dataString}).done(function(data) {
            alert(data);
        });*/
        var encoding = options.encoding || "utf-8";
        function _finishWrite(created) {
            var dataString = "data=" + encodeURIComponent(data) + "&encoding=" + encoding;
            $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/writeFile/" + path, { dataType:"text", type:"POST", data:dataString}).done(function(data) {
                result = JSON.parse(data);
                if(result.errno) {
                    callback(_mapError(result.errno));
                }else{
                    stat(path, function(err, stats) {
                        callback(err, stats, created);
                    });
                }
            });
        }
        stat(path, function (err, stats) {
            if (err) {
                switch (err) {
                case FileSystemError.NOT_FOUND:
                    _finishWrite(true);
                    break;
                default:
                    callback(err);
                }
                return;
            }
            
            if (options.hasOwnProperty("expectedHash") && options.expectedHash !== stats._hash) {
                console.error("Blind write attempted: ", path, stats._hash, options.expectedHash);

                if (options.hasOwnProperty("expectedContents")) {
                    //appshell.fs.readFile(path, encoding, function (_err, _data) {
                    readFile(path, {"encoding": encoding}, function(_err, _data) {
                        if (_err || _data !== options.expectedContents) {
                            callback(FileSystemError.CONTENTS_MODIFIED);
                            return;
                        }
                    
                        _finishWrite(false);
                    });
                    return;
                } else {
                    callback(FileSystemError.CONTENTS_MODIFIED);
                    return;
                }
            }
            
            _finishWrite(false);
        });
    }
    
    function unlink(path, callback) {
        //callback("Cannot modify files on HTTP demo server");
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/unlink/" + path, { dataType: "text"}).done(function(data) {
            result = JSON.parse(data);
            callback(_mapError(result.errno));
        });
    }
    
    function moveToTrash(path, callback) {
        callback("This feature has not been implemented yet. ");
        //callback("Cannot delete files on HTTP demo server");
    }
    
    function initWatchers(changeCallback, offlineCallback) {
        // Ignore - since this FS is immutable, we're never going to call these
        var interval = [];
    }
    
    function watchPath(path, callback) {
        //console.warn("File watching is not supported on immutable HTTP demo server");
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/watch/" + path, { dataType: "text" }).done(function(data) {
            interval[path] = setInterval(function() {
                $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/watcherCheck/" + path, { dataType: "text" }).done(function(data) {
                    var result = JSON.parse(data);
                    $("body").trigger({
                        "path": result.path,
                        "event": result.event,
                        "filename": result.filename
                    });
                });
            }, 10000);
        });
        //callback();
    }
    
    function unwatchPath(path, callback) {
        //callback();
        clearTimeout(interval[path]);
    }
    
    function unwatchAll(callback) {
        //callback();
        for(var i = 0; i < interval.length; i++) {
            clearTimeout(interval[i]);
        }
    }
    
    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        // FIXME
        //throw new Error();
        //filetypes not implemented
        
        // Build up list of items 
        var type;
        if(allowMultipleSelection) {
            console.log("Multiple selections have not been implemented yet. ");
        }
        var dataString = "directoriesOnly=" + chooseDirectories;
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/getItems/" + initialPath/* + "+" + options*/, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
            var message = "<ul class=\"folder-list-menu\">";
            result = JSON.parse(data);
            //console.log(data);
            for(var i = 0; i < result.length; i++) {
                //console.log(data[i]);
                type = result[i].isDirectory;
                message += "<li class=\"folder_goto\" data-folder-path=\"" + result[i].fullPath + "\" data-folder-type=\"" + type + "\">" + result[i].name + "</li>";
            }
            message += "</ul>";
            var latestChosen = "";
        //});
        
        //OLD CODE:
        /*var items = [];
        var dataString = "directoriesOnly=" + chooseDirectories;
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/getItems/" + initialPath/* + "+" + options*//*, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
            alert(data);
            items = data;
            callback(FileSystemError.UNKNOWN);
            console.log(items);
            var itemListDiv = $(document.createElement("div"));
            itemListDiv.addClass("container-scrollable");
            var itemList = $(document.createElement("ul"));
            itemListDiv.append(itemList);
            // Loop over returned value
            for(var i = 0; i < items.length; I++) {
                var itemLi = $(document.createElement("li"));
                itemLi.text(items[i]["name"]);
                itemLi.id(items[i]["fullPath"]);
            }*/
            var dialog = Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_INFO,
                title,
                message,
                [
                    {
                        className: Dialogs.DIALOG_BTN_CLASS_NORMAL,
                        id: Dialogs.DIALOG_BTN_CANCEL,
                        text: "Cancel"
                    },
                    {
                        className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id: "open",
                        text: "Open"
                    }
                ],
                false
            );
            
            var $element = dialog.getElement();
            
            //$(".folder_goto").click(function(event) {
            $(".folder-list-menu").on("click", "li", function(event) {
                //Get info about clicked folder 
                var newpath = $(this).data("folder-path");
                latestChosen = newpath;
                //if(!chooseDirectories) {
                    if($(this).data("folder-type") === true) {
                        $(this).parent().text("Loading...");
                        var elem = event.currentTarget;
                        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/getItems/" + newpath/* + "+" + options*/, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
                            result = JSON.parse(data);
                            //message = "";
                            if(result.length > 0) {
                                message = "<ul class=\"folder-list-menu\">";
                                for(var i = 0; i < result.length; i++) {
                                    var type = result[i].isDirectory;
                                    message += "<li class=\"folder_goto\" data-folder-path=\"" + result[i].fullPath + "\" data-folder-type=\"" + type + "\">" + result[i].name + "</li>";
                                }
                                message += "</ul>";
                            }else{
                                if(chooseDirectories) {
                                    message = "<em class=\"folder-list-menu\">No folders in here</em>";
                                }else{
                                    message = "<em class=\"folder-list-menu\">Empty folder</em>";
                                }
                            }
                            /*console.log($(this));
                            console.log($(this)[0]);
                            console.log($(this).parent());
                            console.log($(this).parent().parent());
                            console.log($(this).parent().parent().parent().parent());
                            console.log(message);
                            console.log(listelement);
                            console.log(listelement[0]);
                            console.log(listelement[0].parent());
                            console.log(listelement.parent().html(message));
                            console.log($(listelement[0]).parent());
                            listelement.parent().html(message);*/
                            //console.log($(elem));
                            //console.log(elem);
                            $(".folder-list-menu").html(message);
                            
                        });
                    }
                //}
            });
            
            $element.one("buttonClick", function(event, action) {
                if(action === Dialogs.DIALOG_BTN_CANCEL) {
                    dialog.close();
                }else{
                    console.log(latestChosen);
                    /*readFile(latestChosen, {}, function(error, file, stats) {
                        callback(error, file, stats);
                    });*/
                    //if(allowMultipleSelection) {
                        latestChosen = [latestChosen];
                    //}
                    callback(0, latestChosen);
                    dialog.close();
                }
                //console.log(latestChosen);
                //console.log(event);
                //console.log(action);
                //dialog.close();
                //dialog.close();
            });
        });
        /*console.log(items);
        var itemListDiv = $(document.createElement("div"));
        itemListDiv.addClass("container-scrollable");
        var itemList = $(document.createElement("ul"));
        itemListDiv.append(itemList);
        // Loop over returned value
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_INFO,
            title,
            itemListDiv,
            [
                {
                    className: Dialogs.DIALOG_BTN_CLASS_NORMAL,
                    id: Dialogs.DIALOG_BTN_CANCEL,
                    text: "Cancel"
                },
                {
                    className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                    id: "open",
                    text: "Open"
                }
            ]
        );*/
    }
    
    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        // FIXME
        //throw new Error();
        // Build up list of items 
        var type;
        var nameInput = "<p><input type=\"text\" id=\"save_file_name\" value=\"" + proposedNewFilename + "\" placeholder=\"File name\"></p>";
        //var finalString = "";
        /*if(allowMultipleSelection) {
            console.log("Multiple selections have not been implemented yet. ");
        }*/
        var dataString = "directoriesOnly=true"/* + chooseDirectories*/;
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/getItems/" + initialPath/* + "+" + options*/, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
            var message = "<ul class=\"folder-list-menu-save\">";
            result = JSON.parse(data);
            //console.log(data);
            for(var i = 0; i < result.length; i++) {
                //console.log(data[i]);
                type = result[i].isDirectory;
                message += "<li class=\"folder_goto\" data-folder-path=\"" + result[i].fullPath + "\" data-folder-type=\"" + type + "\">" + result[i].name + "</li>";
            }
            message += "</ul>";
            var latestChosen = "";
        //});
        
        //OLD CODE:
        /*var items = [];
        var dataString = "directoriesOnly=" + chooseDirectories;
        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/getItems/" + initialPath/* + "+" + options*//*, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
            alert(data);
            items = data;
            callback(FileSystemError.UNKNOWN);
            console.log(items);
            var itemListDiv = $(document.createElement("div"));
            itemListDiv.addClass("container-scrollable");
            var itemList = $(document.createElement("ul"));
            itemListDiv.append(itemList);
            // Loop over returned value
            for(var i = 0; i < items.length; I++) {
                var itemLi = $(document.createElement("li"));
                itemLi.text(items[i]["name"]);
                itemLi.id(items[i]["fullPath"]);
            }*/
            var saveDialog = Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_INFO,
                title,
                (message + nameInput),
                [
                    {
                        className: Dialogs.DIALOG_BTN_CLASS_NORMAL,
                        id: Dialogs.DIALOG_BTN_CANCEL,
                        text: "Cancel"
                    },
                    {
                        className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                        id: Dialogs.DIALOG_BTN_SAVE_AS,
                        text: "Save As"
                    }
                ],
                false
            );
            
            var $saveElement = saveDialog.getElement();
            
            //$(".folder_goto").click(function(event) {
            $(".folder-list-menu-save").on("click", "li", function(event) {
                //Get info about clicked folder 
                var newpath = $(this).data("folder-path");
                latestChosen = newpath;
                //if(!chooseDirectories) {
                    if($(this).data("folder-type") === true) {
                        $(this).parent().text("Loading...");
                        var elem = event.currentTarget;
                        var dataString = "directoriesOnly=true";
                        $.ajax("http://ulkk6b05c55d.liongold.koding.io:7681/api/getItems/" + newpath/* + "+" + options*/, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
                            result = JSON.parse(data);
                            //message = "";
                            if(result.length > 0) {
                                message = "<ul class=\"folder-list-menu-save\">";
                                for(var i = 0; i < result.length; i++) {
                                    var type = result[i].isDirectory;
                                    message += "<li class=\"folder_goto\" data-folder-path=\"" + result[i].fullPath + "\" data-folder-type=\"" + type + "\">" + result[i].name + "</li>";
                                }
                                message += "</ul>";
                            }else{
                                message = "<em class=\"folder-list-menu\">Empty folder</em>";
                            }
                            /*console.log($(this));
                            console.log($(this)[0]);
                            console.log($(this).parent());
                            console.log($(this).parent().parent());
                            console.log($(this).parent().parent().parent().parent());
                            console.log(message);
                            console.log(listelement);
                            console.log(listelement[0]);
                            console.log(listelement[0].parent());
                            console.log(listelement.parent().html(message));
                            console.log($(listelement[0]).parent());
                            listelement.parent().html(message);*/
                            //console.log($(elem));
                            //console.log(elem);
                            $(".folder-list-menu-save").html(message/* + nameInput*/);
                            
                        });
                    }
                //}
            });
            
            $saveElement.one("buttonClick", function(event, action) {
                if(action === Dialogs.DIALOG_BTN_CANCEL) {
                    saveDialog.close();
                }else{
                    console.log(latestChosen);
                    var filename = $("#save_file_name").val();
                    /*readFile(latestChosen, {}, function(error, file, stats) {
                        callback(error, file, stats);
                    });*/
                    //if(allowMultipleSelection) {
                    //    latestChosen = [latestChosen];
                    //}
                    callback(0, (latestChosen + "/" + filename));
                    saveDialog.close();
                }
                //console.log(latestChosen);
                //console.log(event);
                //console.log(action);
                //dialog.close();
                //dialog.close();
            });
        });
        /*console.log(items);
        var itemListDiv = $(document.createElement("div"));
        itemListDiv.addClass("container-scrollable");
        var itemList = $(document.createElement("ul"));
        itemListDiv.append(itemList);
        // Loop over returned value
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_INFO,
            title,
            itemListDiv,
            [
                {
                    className: Dialogs.DIALOG_BTN_CLASS_NORMAL,
                    id: Dialogs.DIALOG_BTN_CANCEL,
                    text: "Cancel"
                },
                {
                    className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                    id: "open",
                    text: "Open"
                }
            ]
        );*/
    }

    
    // Export public API
    exports.showOpenDialog  = showOpenDialog;
    exports.showSaveDialog  = showSaveDialog;
    exports.exists          = exists;
    exports.readdir         = readdir;
    exports.mkdir           = mkdir;
    exports.rename          = rename;
    exports.stat            = stat;
    exports.readFile        = readFile;
    exports.writeFile       = writeFile;
    exports.unlink          = unlink;
    exports.moveToTrash     = moveToTrash;
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;
    
    exports.recursiveWatch    = true;
    exports.normalizeUNCPaths = false;
});