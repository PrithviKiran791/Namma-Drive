const serverless = require('serverless-http');
const path = require('path');

// Import the Express app from the existing server file
const app = require(path.join(__dirname, '..', 'namma-drive-server', 'server.js'));

module.exports = serverless(app);
