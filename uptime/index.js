/*
* Primary file for the API
*
*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Instantiate the HTTP server
const httpServer = http.createServer(function(req, res){
  unifiedServer(req, res);
});

// Start the server
httpServer.listen(config.httpPort, function(){ 
  console.log('The server is listening on port ' + config.httpPort);
});

// Instantiate the HTTPS server
const httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(httpsServerOptions, function(req, res){
  unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function(){ 
  console.log('The server is listening on port ' + config.httpsPort);
});

// All the server logic for both the http and https server
const unifiedServer = function(req, res) {

  // Get the url and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path from the url
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g,'');

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload, if there is any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function(data) {
    buffer += decoder.write(data);
  });

  req.on('end', function() {
    buffer += decoder.end();

    // Choose the handler the request should go to. If one is not found, use notFound handler
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': buffer
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload) {
      // Use the status code called back from the handler, or default to 200
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

      // Use the payload called back by the hanlder, or default to empty object
      payload = typeof(payload) === 'object' ? payload : {};

      // Convert the payload to a string
      const payLoadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payLoadString);

          // Log the request (i.e. path)
    console.log('Returning this response: ', statusCode, payLoadString); 
    });
  });
};

// Define the handlers
const handlers = {};

handlers.ping = function(data, callback) {
  callback(200);
};

handlers.notFound = function(data, callback) {
  callback(404);
};

// Define a request router
const router = {
  'ping': handlers.ping
};