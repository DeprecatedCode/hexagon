/**
 * Hexagon Example
 *
 * @author Nate Ferrero
 */
var hexagon = require('..');

/**
 * Create the app instance
 */
var app = hexagon('./example/shared');
app.debug = true;

/**
 * Listen for requests
 */
app.listen(process.env.PORT, process.env.IP);
