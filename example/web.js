/**
 * Hexagon Example
 *
 * @author Nate Ferrero
 */
var hexagon = require('..');

/**
 * Create the app instance
 */
var app = hexagon('./shared');

/**
 * Listen for requests
 */
app.listen(process.env.PORT, process.env.IP);
