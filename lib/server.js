/*
*   Server related task
*
*
*
*/

// Configuration
const config = require("./config");

//Dependecies
const http = require("http");
const https = require("https");
const fs = require("fs");
const url = require("url");
const path = require("path");
const handler = require("./handlers");
const StringDecoder = require("string_decoder");
const helper = require("./helpers");


//Main servers container
let server = {};

// Create the http server and pass to mainFunction
server.http = http.createServer( (req,res)=> {
    server.mainFunction( req, res);
});



//Set https opions and create https server
server.httpsServerOptions = {
    "key": fs.readFileSync( path.join(__dirname, "/../https/key.pem")),
    "cert": fs.readFileSync( path.join( __dirname, "/../https/cert.pem"))
};
server.https = https.createServer(server.httpsServerOptions, (req, res)=>{
    server.mainFunction( req, res);
});

// A main function for processing
server.mainFunction = ( req, res) => {

    // Check url sent by user
    const parsedUrl = url.parse( req.url, true);
    // get the route
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');
    
    // get the query string
    const querystring = parsedUrl.query;
    // get the headers
    const headers = req.headers;
    //get the method
    const method = req.method.toLowerCase();
    
    // get payload data
    const decoder = new StringDecoder.StringDecoder("utf-8");
    let buffer = "";
    req.on("data",(data)=>buffer+=data);

    req.on("end", ()=>{
        //Pick the handler (default is not found)
        let chosenHandler = server.router.has( trimmedPath) ? server.router.get( trimmedPath) : handler.notFound;

        // data object
        let data = {
            'trimmedPath': trimmedPath,
            'querystring': querystring,
            'headers': headers,
            'method': method,
            'payload': helper.parseJsonToObject(buffer)
        };
   
        //Call the handler
        chosenHandler( data, ( statusCode, payload)=> {
            buffer += decoder.end();

            // set payload to chosen handler or empty one
            var payload = typeof( payload) == 'object' ? payload : {};
            var payloadString = JSON.stringify( payload);

            //set the content type to JSON
            res.setHeader("Content-Type","applications/json");
            //set the status code
            res.writeHead( statusCode);
            res.end( payloadString);

            // log the requested route and the response
            console.log("Request received on path: ",trimmedPath);
            console.log("Response : ", statusCode, payloadString);
            });
    });
    
};


// Router
server.router = new Map();
server.router.set("users", handler.users);
//The tokens endpoint could be optional
server.router.set("tokens", handler.tokens);

//Map login & logout API endpoints
server.router.set("login", handler.login);
server.router.set("logout", handler.logout);

//Map menu
server.router.set("menu", handler.menu);

//Map cart
server.router.set("cart", handler.cart);

//Map order
server.router.set("order", handler.order);


//Init function
server.init = ()=>{
    // reply on http
    server.http.listen( config.httpPort, "localhost", ()=>{
        console.log("Server escuchando en puerto ", config.httpPort," configuracion para ", config.envName);
    });

    //reply on https
    server.https.listen( config.httpsPort, "localhost", ()=>{
        console.log("Server escuchando en puerto ", config.httpsPort," configuracion para ", config.envName);
    });
};

//export the server
module.exports = server;