This plugin originaly created as I was developing Cordova app for Windows 8.1 platform as a target. The main issue was that the webView of that version (v2.0) didn't support html appcache feature. 
So I wrote this plugin in order to iterate over the appcache list and download one by one the files to application local folder.

However, This plugin can be used for any list of files that needed to download, sumply replace the values which set with const keys.

Usage:


1. Install the plugin.

2. 
	    var url = "This-Is-The-Url-Of-The-App-Cache";
            var envelope = {}
            envelope[window.cacheHandler.constKeys.URL] = url;
			
			//The char which on which split operation based 
            envelope[window.cacheHandler.constKeys.SPLIT_BY_KEY] = "\r\n";
			//Base url for for requests 
            envelope[window.cacheHandler.constKeys.BASE_URL] = "http://localhost:1234";
			//The main page which is not cached (if no-store tag applied)
            envelope[window.cacheHandler.constKeys.INDEX_HTML] = "index.html";
            
        
            window.cacheHandler.fetch(envelope, function (done) {
				//Called if all files completed successfully
            }, function (error) {
                //Called if one of the files failed to download
				//error - contains array of failed requests
            });
		

