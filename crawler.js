var Сrawler = new (function () {
    var self = this;

    self.parseUrl = function (str) {       
        var link = document.createElement('a');
        link.href = str;
        var o = {};
        var keys = 'protocol host hostname port pathname search hash href'.split(' ');
        var i = keys.length;
        var k, v;
        while (i--) {
            k = keys[i];
            v = link[k];
            o[k] = v;
        }
        return o;
    };

    /**
     * --//--
     *
     * @param {object} options
     * @param {string} options.startUrl URL с которого начинаем обход сайта
     * @param {RegExp} options.filterUrlRegex дополнительный фильтр
     * @param {function} options.onMatch = function (url, content) { ... }
     * @param {function} options.onEnd = function () { ... }
     */
    self.run = function (options) {
        options = options || {};
        var urls = [];
        var counter = 0;
        var obj = self.parseUrl(options.startUrl ? options.startUrl.replace(/#.*/, '') : '/');
        (function process(cur) {
            var xhr = new XMLHttpRequest;
            xhr.open('GET', cur.href);
            var isHtml;
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 2) {
                    isHtml = xhr.getResponseHeader('content-type').split(';')[0] == 'text/html';
                    // принудительно отменяем получение тела ответа
                    if (!isHtml) {
                        xhr.abort();
                    }
                }
                else if (xhr.readyState == 4) {
                    if (isHtml && xhr.status == 200) {
                        var onMatch = options.onMatch;
                        if (typeof onMatch == 'function') {
                            try {
                                onMatch(cur.href, xhr.response);
                            }
                            catch (err) {}
                        }                     
                        var re = /<a(?!rea)[^>]+href=('|")(.*?)\1/gi;
                        var match;
                        var url;
                        var next;
                        while (match = re.exec(xhr.response)) {
                            url = match[2];
                            url = url.trim();
                            url = url.replace(/#.*/, '');
                            // console.log(url);
                            if (!/^https?:[\\/]{2}/.test(url)) {
                                if (/^\w+:/.test(url)) {
                                    continue;
                                }
                                if (!/^[\\/]/.test(url)) {
                                    url = cur.pathname.replace(/[^/]+$/, '') + url;
                                }
                            }
                            next = self.parseUrl(url);
                            if (next.hostname == location.hostname) {
                                if (urls.indexOf(next.href) == -1) {
                                    if (options.filterUrlRegex) {
                                        if (!options.filterUrlRegex.test(next.href)) {
                                            continue;
                                        }
                                    }
                                    process(next);
                                }
                            }
                        }                      
                    }
                    if (--counter < 1) {
                        var onEnd = options.onEnd;
                        if (typeof onEnd == 'function') {
                            onEnd();
                        }
                    }
                }
            };
            // xhr.onerror = function (err) { console.log(err); };
            xhr.send();
            urls.push(cur.href);
            ++counter;
        })(obj);
    };
})();
/* 


console.log('--start');
L = [];
Сrawler.run({
    startUrl: '/suppliers/',
    filterUrlRegex: /^[^?]+\/suppliers\/cat\/\d+\/(\?page=\d+)?$/,
    onMatch: function (url, content) { 
        console.log(url);
        var re = /<a href="\/send_message\/([^/]+)/g;
        var match;
        while (match = re.exec(content)) {
            L.push(match[1]);
        }
    }, 
    onEnd: function() { 
        saveFile(L.join('\n'));
        console.log('--end'); 
    }
});

*/

function saveFile(data, name) {
    name = name || '';
    var link = document.createElement('a');
    var blob = new Blob([data]);
    var url = URL.createObjectURL(blob);
    link.href = url; 
    link.setAttribute('download', name);
    link.style.display = 'none';  
    document.body.appendChild(link);
    link.onclick = function () {
        document.body.removeChild(link);
    };
    link.click();
};