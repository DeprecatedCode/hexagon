/**
 * Hexagon Example
 *
 * @author Nate Ferrero
 */
var hexagon = require('..');

/**
 * Create the app instance
 */
var app = hexagon(require('./shared/index.js'));

/**
 * Listen for requests
 */
app.listen(process.env.PORT, process.env.IP);
