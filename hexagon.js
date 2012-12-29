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
    return {
        _lookup: function(next, req, ret) {
            location += '/' + next;
            fs.stat(location, function(err, stats) {
                if(err) throw err;
                if(stats.isDirectory()) {
                    ret(self.dir(location));
                } else {
                    var ext = path.extname(location);
                    switch(ext) {
                        
                        /**
                         * Require JS files
                         */
                        case '.js':
                            ret(require(location));
                            break;
                            
                        /**
                         * Error on other extensions
                         */
                        default:
                            throw new Error("Extension " + ext + " not supported");
                    }
                }
            });
        }
    };
};

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
        throw new Error("Application timeout on " + req.url);
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
        node['_' + req.method.toLowerCase()](req, ret);
    } else {
        ret(node);
    }
};

app.prototype = p;

module.exports = function() {
    return new app();
};
