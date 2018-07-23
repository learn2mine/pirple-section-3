/*
*Primary file for the API
*
*/

// Dependencies
var server = require('./lib/server');
var workers = require('./lib/workers.js');

// Declare the application
var app = {}

// Init function
app.init = function(){
  // Start the server
  server.init();

//   Start the workers
  workers.init();
};

// Execute
app.init();

module.exports = app;
