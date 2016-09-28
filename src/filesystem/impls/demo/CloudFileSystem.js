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
/*global define, window, $, Mustache */

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
    //var CORE_EXTENSIONS_PREFIX = PathUtils.directory(window.location.href) + "extensions/default/";
//    var USER_EXTENSIONS_PREFIX = "/.brackets.user.extensions$/";
//    var CONFIG_PREFIX = "/.$brackets.config$/";

    var dialogHTML = require("text!htmlContent/file-system-dialog.html");
    var latestChosen = [];
    
    var FILESYSTEM_SERVER_URL = "http://brackets-on-vm-liongold.c9users.io:8081/api/";
    
    
    // Static, hardcoded file tree structure to serve up. Key is entry name, and value is either:
    //  - string = file
    //  - object = nested folder containing more entries
    /*var demoContent = {
        "index.html": "<html>\n<head>\n    <title>Hello, world!</title>\n</head>\n<body>\n    Welcome to Brackets!\n</body>\n</html>",
        "main.css": ".hello {\n    content: 'world!';\n}",
        "main.js": "function sayHello() {\n    console.log('Hello, world!');\n}"
    };*/
    
    
    /*function _startsWith(path, prefix) {
        return (path.substr(0, prefix.length) === prefix);
    }
    
    function _stripTrailingSlash(path) {
        return path[path.length - 1] === "/" ? path.substr(0, path.length - 1) : path;
    }*/
    
    /**
     * Convert appshell error codes to FileSystemError values.
     * 
     * Copied from AppshellFileSystem.js from the master branch
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
        case 18:
            return FileSystemError.INVALID_PARAMS;
        case -2:
            return FileSystemError.NOT_FOUND;
        case 3:
            return FileSystemError.NOT_READABLE;
        case -13:
            return FileSystemError.NOT_WRITABLE;
        case 46:
            return FileSystemError.UNSUPPORTED_ENCODING;
        case 54:
            return FileSystemError.OUT_OF_SPACE;
        case 47:
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
    
    
    function _loadFromFileSystemServer (action, path, callback, settings) {
        
        if (typeof settings === "undefined") {
            settings = {};
        }
        
        $.ajax(FILESYSTEM_SERVER_URL + action + "/" + path, settings).done(function(data) {
            callback(data);
        });
        
    }
    
    
    function stat(path, callback) {
        
        if (_ignoreableFile(path)) {
            callback(FileSystemError.NOT_FOUND);
            return;
        }
        
        if (path.match(/\/\$\.brackets\.config\$\/.*\.json/g)) {
            callback(FileSystemError.NOT_FOUND);
            return;
        }
        

        _loadFromFileSystemServer("stat", path, function(result) {
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
        _loadFromFileSystemServer("exists", path, function(result) {
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
        _loadFromFileSystemServer("readdir", path, function(result) {
            if(result.errno) {
                callback(_mapError(result.errno));
                return;
            }
            var count = result.length;
            if(!count) {
                callback(null, [], [], []);
                return;
            }
            var stats = [];
            result.forEach(function(value, index) {
                _loadFromFileSystemServer("stat", path, function(statsResult) {
                    stats[index] =  statsResult.errno || statsResult;
                    count--;
                    if(count <= 0) {
                        callback(null, result, stats);
                    }
                });
            });
        });
    }
    
    function mkdir(path, mode, callback) {
        if(typeof mode === "function") {
            callback = mode;
            mode = parseInt("0755", 8);
        }
        var dataString = "path=" + path + "&mode=" + mode;
        _loadFromFileSystemServer("mkdir", "", function(result) {
            if(result.errno) {
                callback(_mapError(result.errno));
            }else{
                _loadFromFileSystemServer("stat", path, function(statsResult) {
                    if(statsResult.errno) {
                        callback(statsResult, []);
                    }else{
                        callback([], statsResult);
                    }
                });
            }
        }, { type: "POST", data: dataString });
    }
    
    function rename(oldPath, newPath, callback) {
        var dataString = "oldPath=" + oldPath + "&newPath=" + newPath;
        _loadFromFileSystemServer("rename", "", function(data) {
            alert(data);
        }, { type: "POST", data: dataString });
    }
    
    function _ignoreableFile(path) {
        if (path.match(/\extensions\/default\/.*\/package.json/g) || path.match(/\extensions\/default\/.*\/requirejs-config.json/g)) {
            return true;
        }
        return false;
    }
    
    function readFile(path, options, callback) {
        //var encoding = options.encoding || "utf-8";
        // callback to be executed when the call to stat completes
        //  or immediately if a stat object was passed as an argument
        function doReadFile(statsResult) {
            if (statsResult.size > (FileUtils.MAX_FILE_SIZE)) {
                callback(FileSystemError.EXCEEDS_MAX_FILE_SIZE);
            } else {
                options = $.param(options);
                var dataString = "options=" + JSON.stringify(options);
                _loadFromFileSystemServer("readFile", path, function(result) {
                    if (result.errno) {
                        callback(_mapError(result.errno));
                    } else {
                        callback(null, result.contents, statsResult);
                    }
                }, { crossDomain: true, type: "POST", data: dataString });
            }
        }

        if (_ignoreableFile(path)) {
            callback(FileSystemError.NOT_FOUND);
            return;
        }
        
        if (path.match(/\/\$\.brackets\.config\$\/.*\.json/g)) {
            callback(FileSystemError.NOT_FOUND);
            return;
        }
        
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
        var encoding = options.encoding || "utf-8";
        
        if (_ignoreableFile(path)) {
            callback(FileSystemError.NOT_FOUND);
            return;
        }
        
        if (path.match(/\/\$\.brackets\.config\$\/.*\.json/g)) {
            callback(FileSystemError.NOT_FOUND);
            return;
        }
        
        function _finishWrite(created) {
            var dataString = "data=" + encodeURIComponent(data) + "&encoding=" + encoding;
            _loadFromFileSystemServer("writeFile", path, function(result) {
                if(result.errno) {
                    callback(_mapError(result.errno));
                }else{
                    stat(path, function(err, stats) {
                        callback(err, stats, created);
                    });
                }
            }, { dataType:"text", type:"POST", data:dataString });
        }
        stat(path, function (err, stats) {
            if (err) {
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
        _loadFromFileSystemServer("unlink", path, function(result) {
            callback(_mapError(result.errno));
        });
    }
    
    function moveToTrash(path, callback) {
        alert("This feature has not been implemented yet. ");
    }
    
    function initWatchers(changeCallback, offlineCallback) {
        alert("initWatchers");
        // Ignore - since this FS is immutable, we're never going to call these
        interval = [];
    }
    
    function watchPath(path, callback) {
        //console.warn("File watching is not supported on immutable HTTP demo server");
        alert("watchPath");
        _loadFromFileSystemServer("watch", path, function(data) {
            interval[path] = window.setInterval(function() {
                _loadFromFileSystemServer("watcherCheck", path, function(result) {
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
        window.clearTimeout(interval[path]);
    }
    
    function unwatchAll(callback) {
        //callback();
        for(var i = 0; i < interval.length; i++) {
            window.clearTimeout(interval[i]);
        }
    }
    
    function _loadFileSystemDialog(path, proposedNewFilename, directoriesOnly, fullRender, allowMultipleSelection, title, type, callback) {
        var dataString = "",
            dialog,
            newpath = "";
        
        if(directoriesOnly) {
            dataString = "directoriesOnly=true";
        }
        
        _loadFromFileSystemServer("getItems", path, function(data) {
            var dialogInfo = {
                folderContents: data,
                Strings: Strings,
                latestChosen: path,
                proposedNewFilename: proposedNewFilename,
                title: title,
                save_dialog: ((type === "save") ? true : false),
            };
            
            if(fullRender) {
                dialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(dialogHTML, dialogInfo), false);
            }else{
                $(".modal.instance.in:last").html(Mustache.render(dialogHTML, dialogInfo));
            }
            
            $(".contents-list").on("click", "a", function(event) {
                $(this).addClass("folder-link-selected");
                newpath = $(this).data("folder-path");
                
                if($(this).data("folder-type") === "up-level") {
                    //Remove part after second last / and set as newpath
                    newpath = newpath.substring(0, newpath.lastIndexOf("/", (newpath.length - 2)));
                    console.log(newpath);
                }
                
                if(!allowMultipleSelection) {
                    latestChosen[0] = newpath;
                } else {
                    latestChosen.push(newpath);
                }
                
                if($(this).data("folder-type") === "directory" || $(this).data("folder-type") === "up-level") {
                    $(this).removeClass("folder-link-selected");
                    _loadFileSystemDialog(newpath, proposedNewFilename, directoriesOnly, false, false, title);
                }
            });
            

            if(fullRender) {
                callback(dialog);
            }else{
                return true;
            }
            
        }, { crossDomain: true, type: "POST", data: dataString });
        
    }    
    
    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {

        
        _loadFileSystemDialog(initialPath, title, chooseDirectories, true, allowMultipleSelection, title, "open", function(dialog) {
            var $openElement = dialog.getElement();
            
            $openElement.one("buttonClick", function(event, action) {
                if(action === Dialogs.DIALOG_BTN_CANCEL) {
                    dialog.close();
                }else{
                    callback(0, latestChosen);
                    dialog.close();
                }
            });
        });
    }
    
    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        latestChosen = initialPath;
            
        _loadFileSystemDialog(initialPath, proposedNewFilename, true, true, false, Strings.SAVE_FILE_AS, "save", function(dialog) {
            var $saveElement = dialog.getElement();
            $saveElement.one("buttonClick", function(event, action) {
                if(action === Dialogs.DIALOG_BTN_CANCEL) {
                    dialog.close();
                }else{
                    console.log(latestChosen);
                    var filename = $("#save_file_name").val();
                    callback(0, (latestChosen + "/" + filename));
                    dialog.close();
                }
            });
        }); 
    }
    
    function _checkFSServerAvailability(callback) {
        //This uses Promises - can't use the new function for now
        $.ajax(FILESYSTEM_SERVER_URL + "ping/")
            .success(function() {
                callback(true);
            })
            .fail(function() {
                callback(false);
            });
    }
    
    $(document).ready(function() {
        window.setInterval(function() {
            $("#server-connectivity-check").removeClass("connectionInactive connectionActive");
            _checkFSServerAvailability(function (isConnected) {
                if(isConnected) {
                    $("#server-connectivity-check").addClass("connectionActive");
                } else {
                    $("#server-connectivity-check").addClass("connectionInactive");
                }
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