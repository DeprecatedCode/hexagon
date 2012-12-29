/**
 * Hexagon
 * 
 * @author Nate Ferrero
 */
var app = function(location) {
    this.root = this.dir(path.resolve(location));
    this.timeout = 5000;
}, p = {}, fs = require('fs'),
         path = require('path');
    
/**
 * Attach a dir handler
 */
p.dir = function(location) {
    var self = this;
    var lookup = function(next, req, ret) {
        var loc = location + (location.substr(-1, 1) == '/' ? '' : '/') + next;
        fs.stat(loc, function(err, stats) {
            if(err) {
                ret({"_*": {"error": "Path " + loc + " does not exist"}});
            } else if(stats.isDirectory()) {
                ret(self.dir(loc));
            } else {
                var ext = path.extname(loc);
                switch(ext) {
                    
                    /**
                     * Require JS files
                     */
                    case '.js':
                        ret(require(loc));
                        break;
                        
                    /**
                     * Error on other extensions
                     */
                    default:
                        ret({"_*": {"error": "Extension " + ext + " not supported"}});
                }
            }
        });
    };
    
    /**
     * Directory node proxies all requests to index.js
     */
    return {
        _lookup:    lookup,
        _get:       this.indexMethod(lookup, '_get'),
        _post:      this.indexMethod(lookup, '_post'),
        _put:       this.indexMethod(lookup, '_put'),
        _delete:    this.indexMethod(lookup, '_delete')
    };
};

/**
 * Index method
 */
p.indexMethod = function(lookup, method) {
    return function(req, ret) {
        lookup('index.js', req, function(data) {
            data[method](req, ret);
        });        
    }
}

/**
 * Listen on port and ip
 */
p.listen = function(port, ip) {
    var self = this;
    require('http')
        .createServer(
            function(req, resp) {
                self.handle(req, resp);
            }
        ).listen(port || 4040, ip);
};

/**
 * Handler
 */
p.handle = function(req, resp) {
    
    /**
     * Callback
     */
    var ret = function(data) {
        if(typeof data !== 'string') {
            data = JSON.stringify(data);
        }
        resp.end(data);
        clearTimeout(req._hexagon.timer);
    };
    
    /**
     * Add hexagon object
     */
    req._hexagon = {};
    
    /**
     * Keep a timer to kill long requests
     */
    req._hexagon.timer = setTimeout(function() {
        ret({"error": "Application timeout"});
    }, this.timeout);
    
    /**
     * Handle
     */
    var segments = req.url.split('/');
    segments.shift();
    return this.load(segments, req, ret);
};

/**
 * Loader callback
 */
p.loader = function(node, next, segments, req, ret) {
    var self = this;
    return function(data) {
        node[next] = data;
        self.load(segments, req, ret);
    };
};

/**
 * Load a node
 */
p.load = function(segments, req, ret) {
    var node = this.root;
    var location = '';
    for(var i = 0; i < segments.length; i++) {
        var next = segments[i];
        location += (location === '' ? '' : '.') + next;
        if(typeof node[next] === 'undefined') {

            /**
             * Check if lookup function is available
             */
            if(typeof node._lookup === 'function') {
                return node._lookup(next, req, this.loader(node, next, segments, req, ret));
            }

            throw new ReferenceError("Component " + location + " not found");
        }
        node = node[next];
    }
    
    /**
     * Immediately send non-objects
     */
    if(typeof node === 'object') {
        var value = node['_' + req.method.toLowerCase()];
        if(typeof value === 'undefined' && typeof node['_*'] !== 'undefined') {
            value = node['_*'];
        }
        if(typeof value === 'function') {
            value(req, ret);
        } else {
            ret(value);
        }
    } else {
        ret(node);
    }
};

app.prototype = p;

module.exports = function(location) {
    return new app(location);
};
