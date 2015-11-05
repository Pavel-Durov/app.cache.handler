var ResourceHandler = function () {

};

ResourceHandler.prototype.fetch = function (args, success, error) {
    cordova.exec(success, error, "resourceHandler", "fetch", args);
};

var resourceHandler = new ResourceHandler();

resourceHandler.constKeys = {
    SPLIT_BY_KEY: "splitby",
    URL: "url",
    BASE_URL: "baseUrl",
    CONSOLE_LOG: "consoleLog",
    INDEX_HTML: "indexHTML"
}


resourceHandler.fetch = function (args, successCallback, errorCallback) {

    if (resourceHandler.checkArgs(args)) {

        resourceHandler.logEnabled = args[resourceHandler.constKeys.CONSOLE_LOG];
        resourceHandler.baseUrl = args[resourceHandler.constKeys.BASE_URL];
        resourceHandler.startPage = args[resourceHandler.constKeys.INDEX_HTML];

        var splitby = args[resourceHandler.constKeys.SPLIT_BY_KEY];
        var options = {
            url: args[resourceHandler.constKeys.URL]
        }

        WinJS.xhr(options).done(
        function completed(request) {
            if (request) {
                var resonseTxt = request.responseText;
                if (resonseTxt) {
                    var splitted = resonseTxt.split(splitby)
                    if (splitted) {
                        var promises = [];

                        for (var i = 0; i < splitted.length ; ++i) {
                            var currentURL = splitted[i];
                            if (currentURL && currentURL.indexOf(".") > -1) { //Dummy check if it is a file
                                promises.push(resourceHandler.DealWithURL(currentURL));
                            }
                        }

                        WinJS.Promise.join(promises)
                            .then(function (args) {
                                //Success

                                resourceHandler.DownloadStartUpHTML
                                if (successCallback) {
                                    successCallback();
                                }

                            }, function (error) {
                                //Error
                                resourceHandler.DownloadStartUpHTML()
                                .done(function (args) {
                                    if (errorCallback) {
                                        errorCallback(error);
                                    }
                                });

                            }).done(function (done) {});
                    }
                }
            }
        });

    }
}

resourceHandler.DownloadStartUpHTML = function () {
    return new WinJS.Promise(function (complete, error) {
        resourceHandler.DealWithURL(resourceHandler.startPage).then(function () { complete() });
    });
}

resourceHandler.checkArgs = function (args) {
    return args && WinJS && args.splitby && args.url && args.baseUrl;
}

resourceHandler.getFolderFromPathRecursive = function (path, rootFolder) {

    var normalizedPath = path.replace(/\/?[^\/]+\.[^\.\/]+$/, ""),
        folders = normalizedPath.split(/\//),
        subFolderName = folders.shift();
        
    return new WinJS.Promise(function (complete, error) {
        if (!subFolderName || !subFolderName.length) {
            complete(rootFolder);
            return;
        }
        rootFolder.createFolderAsync(subFolderName, Windows.Storage.CreationCollisionOption.openIfExists)
                .then(
                    function (folder) {
                        return resourceHandler.getFolderFromPathRecursive(folders.join("/"), folder);
                    },error
                )
                .then(
                    function (folder) {
                        complete(folder);
                        return;
                    },error
                )
    });
}

resourceHandler.DealWithURL = function (fileName) {

    return new WinJS.Promise(function (complete, error) {

        resourceHandler.getFolderFromPathRecursive(fileName, WinJS.Application.local.folder)
        .then(
            function (subFolder) {
                resourceHandler.log("creating file in folder: " +  fileName + subFolder.name);
                var index = fileName.lastIndexOf("/");
                var newStr = fileName.substr(++index, fileName.length);

                subFolder.createFileAsync(newStr, Windows.Storage.CreationCollisionOption.replaceExisting)
                    .done(function (localStorageFile) {
                        var index = localStorageFile.path.lastIndexOf("LocalState");
                        var relativeUrl = localStorageFile.path.substring(index + 11, localStorageFile.path.length);

                        var url = resourceHandler.baseUrl ? resourceHandler.baseUrl + "\\" + relativeUrl : relativeUrl;
                        resourceHandler.DownloadFile(url, localStorageFile, complete, error)
                    })
            }
        )
    });
}


resourceHandler.DownloadFile = function (absoleteUrl, localStorageFile, complete, error) {
    var options = {
        url: absoleteUrl,
        responseType: 'arraybuffer'
    }

    WinJS.xhr(options).then(function onxhr(ab) {
        if (ab) {
            var bytes = new Uint8Array(ab.response, 0, ab.response.byteLength);
            Windows.Storage.FileIO.writeBytesAsync(localStorageFile, bytes)
                .done(function () {
                    complete();
                });
        }

    }, function onerror(err) {

        var index = localStorageFile.path.lastIndexOf("LocalState");
        var relativeUrl = localStorageFile.path.substring(index + 11, localStorageFile.path.length);

        err.url = resourceHandler.baseUrl ? resourceHandler.baseUrl + "\\" + relativeUrl : relativeUrl,
        error(err);
    });
}

resourceHandler.log = function (str) {

    if (str && resourceHandler.logEnabled) {
        console.log(str);
    }
}


module.exports = resourceHandler

cordova.commandProxy.add("resourceHandler", {
    fetch: resourceHandler.fetch
});

