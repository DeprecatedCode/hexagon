/**
 * Hexagon
 * 
 * @author Nate Ferrero
 */
var app = function(root) {
    this.root = root;
    this.timeout = 5000;
    this.debug = false;
}, p = {};

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
        if(typeof data === 'function') {
            data(req, ret);
        }
        else {
            if(typeof data !== 'string') {
                data = JSON.stringify(data);
            }
            resp.end(data);
            clearTimeout(req._hexagon.timer);
        }
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
    if(segments.length > 0 && segments[segments.length - 1] === '') {
        segments.pop();
    }
    return this.load(segments, req, ret);
};

/**
 * Loader callback
 */
p.loader = function(node, next, segments, req, ret) {
    var self = this;
    return function(data, override) {
        node[override || next] = data;
        self.load(segments, req, ret);
    };
};

/**
 * Load a node
 */
p.load = function(segments, req, ret) {
    var node = this.root;
    var c = '';
    for(var i = 0; i < segments.length; i++) {
        var next = segments[i];
        c += (c === '' ? '' : '/') + next;
        if(typeof node[next] === 'undefined') {

            /**
             * Check if lookup function is available
             */
            if(typeof node._lookup === 'function') {
                return node._lookup(next, req, this.loader(node, next, segments, req, ret));
            }

            ret({"error": "Component " + c + " not found"});
            return;
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
