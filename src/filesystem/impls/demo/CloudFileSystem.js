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
    //var AjaxFileSystem  = require("filesystem/impls/demo/AjaxFileSystem");
    var Dialogs         = require("widgets/Dialogs");
    //var DefaultDialogs  = require("widgets/DefaultDialogs");
    var FileUtils       = require("file/FileUtils");
    var Strings         = require("strings");
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

    var dialogHTML = require("text!htmlContent/file-system-dialog.html");
    var latestChosen = "";
    
    
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
        
        //alert(err);
        switch (err) {
        case /*appshell.fs.ERR_INVALID_PARAMS*/18:
            return FileSystemError.INVALID_PARAMS;
        case /*appshell.fs.ERR_NOT_FOUND*//*34*/-2:
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
    /*function _wrap(cb) {
        return function (err) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = _mapError(args[0]);
            cb.apply(null, args);
        };
    }*/
    
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
        $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/stat/" + path, { dataType: "text"}).done(function(data) {
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
        $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/exists/" + path, { dataType: "text"}).done(function(data) {
            result = JSON.parse(data);
            /*if(result.exists) {
                callback(null, false);
            }else if(result.errno) {
                callback(result);
            }else{
                callback(null, true);
            }*/
            if(result.errno === 34) {
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
        $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/readdir/" + path, { dataType: "text"}).done(function(data) {
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
                $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/stat/" + path + "/" + value, {dataType:"text"}).done(function(data) {
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
        $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/mkdir/"/* + path + "+" + mode*/, { dataType: "text", type: "POST", data: dataString}).done(function(data) {
            result = JSON.parse(data);
            if(result.errno) {
                callback(_mapError(result.errno));
            }else{
                $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/stat/" + path, { dataType: "text"}).done(function(data) {
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
        $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/rename/"/* + oldPath + "+" + newPath*/, { dataType: "text", type: "POST", data: dataString}).done(function(data) {
            alert(data);
        });
    }
    
    function readFile(path, options, callback) {
        console.log("Reading 'file': " + path);
        //var encoding = options.encoding || "utf-8";
        // callback to be executed when the call to stat completes
        //  or immediately if a stat object was passed as an argument
        function doReadFile(statsResult) {
            if (statsResult.size > (FileUtils.MAX_FILE_SIZE)) {
                callback(FileSystemError.EXCEEDS_MAX_FILE_SIZE);
            } else {
                //appshell.fs.readFile(path, encoding, function (_err, _data) {
                options = $.param(options);
                var dataString = "options=" + JSON.stringify(options);
                $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/readFile/" + path/* + "+" + options*/, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
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
        console.log("writeFile called");
        var encoding = options.encoding || "utf-8";
        function _finishWrite(created) {
            console.log("finish write");
            var dataString = "data=" + encodeURIComponent(data) + "&encoding=" + encoding;
            $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/writeFile/" + path, { dataType:"text", type:"POST", data:dataString}).done(function(data) {
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
                //alert(err);
                switch (err) {
                case FileSystemError.NOT_FOUND:
                    _finishWrite(true);
                    break;
                default:
                    alert("Error called");
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
        $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/unlink/" + path, { dataType: "text"}).done(function(data) {
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
        $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/watch/" + path, { dataType: "text" }).done(function(data) {
            interval[path] = setInterval(function() {
                $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/watcherCheck/" + path, { dataType: "text" }).done(function(data) {
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
    
    function _loadFileSystemDialog(path, proposedNewFilename, directoriesOnly, fullRender, allowMultipleSelection, title, type, callback) {
        var dataString = "",
            dialog,
            newpath = "";
        
        if(allowMultipleSelection) {
            alert("Multiple selections are not supported yet. ");
        }
        
        if(directoriesOnly) {
            dataString = "directoriesOnly=true";
        }
        
        $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/getItems/" + path, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
            var dialogInfo = {
                folderContents: JSON.parse(data),
                Strings: Strings,
                latestChosen: path,
                proposedNewFilename: proposedNewFilename,
                title: title,
                save_dialog: ((type === "save") ? true : false),
            };
            
            if(fullRender) {
                dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(dialogHTML, dialogInfo), false);
                //return dialog.getElement();
            }else{
                $(".modal.instance.in:last").html(Mustache.render(dialogHTML, dialogInfo));
                //return true;
            }
            
            $(".contents-list").on("click", "a", function(event) {
                newpath = $(this).data("folder-path");
                
                if($(this).data("folder-type") === "up-level") {
                    //Remove part after second last / and set as newpath
                    newpath = newpath.substring(0, newpath.lastIndexOf("/", (newpath.length - 2)));
                    console.log(newpath);
                }
                
                latestChosen = newpath;
                if($(this).data("folder-type") === "directory") {
                    _loadFileSystemDialog(newpath, proposedNewFilename, true, false, false);
                }
            });
            
            //return dialog.getElement();
            
            if(fullRender) {
                console.log("line 684");
                console.log(dialog.getElement());
                //return dialog.getElement();
                callback(dialog);
            }else{
                return true;
            }
            
            console.log("line 690");
            //return true;
        });
        
        console.log("line 693");
    }    
    
    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {

        
        console.log(chooseDirectories);
        _loadFileSystemDialog(initialPath, title, chooseDirectories, true, allowMultipleSelection, title, "open", function(dialog) {
            var $openElement = dialog.getElement();
            
            $openElement.one("buttonClick", function(event, action) {
                if(action === Dialogs.DIALOG_BTN_CANCEL) {
                    dialog.close();
                }else{
                    console.log(latestChosen);
                    latestChosen = [latestChosen];
                    callback(0, latestChosen);
                    dialog.close();
                }
            });
        });
    }
    
    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        //var type, folderContents, dialog, /*latestChosen, */newpath;
        //var dataString = "directoriesOnly=true";
        latestChosen = initialPath;
        
        /*$.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/getItems/" + initialPath, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
            //folderContents = _loadContents(initialPath);
            var dialogInfo = {
                folderContents: JSON.parse(data),
                Strings: Strings,
                latestChosen: latestChosen,
                proposedNewFilename: proposedNewFilename,
                //"folderContents": JSON.padata,
            };
            console.log("Folder Contents ");
            console.log(dialogInfo);
            
            dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(dialogHTML, dialogInfo), false);*/
            
        _loadFileSystemDialog(initialPath, proposedNewFilename, true, true, false, Strings.SAVE_FILE_AS, "save", function(dialog) {
            console.log("line 718");
            var $saveElement = dialog.getElement();
            $saveElement.one("buttonClick", function(event, action) {
                console.log("line 727");
                if(action === Dialogs.DIALOG_BTN_CANCEL) {
                    console.log("line 729");
                    dialog.close();
                }else{
                    console.log(latestChosen);
                    var filename = $("#save_file_name").val();
                    callback(0, (latestChosen + "/" + filename));
                    dialog.close();
                }
            });
        }); //dialog.getElement();
        console.log("line 712");
            //console.log($saveElement);
            /*$(".contents-list").on("click", "a", function(event) {
                newpath = $(this).data("folder-path");
                latestChosen = newpath;
                
                if($(this).data("folder-type") === "up-level") {
                    //Remove part after second last / and set as newpath
                    //newpath = newpath.substring(0, newpath.lastIndexOf("/", (newpath.length - 2)));
                    //console.log(newpath);
                }
                
                $.ajax("http://brackets-on-vm-liongold.c9users.io:8081/api/getItems/" + newpath, { dataType: "text", crossDomain: true, type: "POST", data: dataString }).done(function(data) {
    
                    var dialogInfo = {
                        folderContents: JSON.parse(data),
                        Strings: Strings,
                        latestChosen: latestChosen,
                        proposedNewFilename: proposedNewFilename
                    };
                    //dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(dialogHTML, dialogInfo), false);
                    //console.log(Mustache.render(dialogHTML, dialogInfo));
                    $(".modal.instance.in:last").html(Mustache.render(dialogHTML, dialogInfo));
                
                });
                
                _loadFileSystemDialog(newpath, proposedNewFilename, true, false);
                
            });*/
        
            //Process file clock save
            /*$saveElement.one("buttonClick", function(event, action) {
                if(action === Dialogs.DIALOG_BTN_CANCEL) {
                    dialog.close();
                }else{
                    console.log(latestChosen);
                    var filename = $("#save_file_name").val();
                    callback(0, (latestChosen + "/" + filename));
                    dialog.close();
                }
            });*/
                
        //})
    }
    
    $(document).ready(function() {
        setInterval(function() {
            $("#server-connectivity-check").removeClass("connectionInactive");
            $("#server-connectivity-check").removeClass("connectionActive");
            $.ajax(/*"http://ulkk6b05c55d.liongold.koding.io:7681/api/ping/"*/ "http://brackets-on-vm-liongold.c9users.io:8081/api/ping/")
                .success(function() {
                    console.log("connected successfully");
                    $("#server-connectivity-check").addClass("connectionActive");
                })
                .fail(function() {
                    console.log("connection failed");
                    $("#server-connectivity-check").addClass("connectionInactive");
                });
        }, 60000);
    });
    
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