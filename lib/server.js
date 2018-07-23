/*
* Server-related tasks
*
*/


//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');

// Instantiate the server module object
var server = {};

// Instantiate the http server
server.httpServer = http.createServer(function(req,res){
  server.unifiedServer(req,res);
});

// Instantiate the HTTPS server
server.httpsServerOptions ={
  'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
  'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions,function(req,res){
  server.unifiedServer(req,res);
});
// All the server logif for the http and https server
server.unifiedServer = function(req,res){

    // Get the URL and parse it
    var parsedURL = url.parse(req.url,true);

    // Get the path
    var path = parsedURL.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedURL.query;

    // Get the HTTP metthod
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload if there is any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data',function(data){
      buffer += decoder.write(data);
    });
    req.on('end',function(){
      buffer += decoder.end();

      // Choose the handler this request should go to, if one is not found use the notFound handler
      var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

      // Construct the data object to send to the handler
      var data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : queryStringObject,
        'method' : method,
        'headers' : headers,
        'payload' : helpers.parseJsonToObject(buffer)
      };

      //Route the request to the handler specified in the router
      chosenHandler(data,function(statusCode,payload){
        // Use the status code called back by the handlers
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

        // Use the payload called back by the handlers
        payload = typeof(payload) =='object' ? payload : {};

        // Convert the payload to a string
        var payloadString = JSON.stringify(payload);

        // Return the response
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);

        // Log the request path
        console.log('Returning this response: ',statusCode);

      });


    });
};

// Define a request router
server.router = {
  'sample' : handlers.ping,
  'users' : handlers.users,
  'tokens' : handlers.tokens,
  'checks' : handlers.checks
};

// Init script
// Start the http server
server.init = function(){
  server.httpServer.listen(config.httpPort,function(){
    console.log("The server is listening on port "+config.httpPort+" in "+config.envName+"!");
  });
  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort,function(){
    console.log("The server is listening on port "+config.httpsPort+" in "+config.envName+"!");
  });

};


// Export the module
module.exports = server;
