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

        //setup the chosen handler for any resoruce in the public directory
        chosenHandler = trimmedPath.indexOf("public/") > -1 ? handler.public : chosenHandler;

        // data object
        let data = {
            'trimmedPath': trimmedPath,
            'querystring': querystring,
            'headers': headers,
            'method': method,
            'payload': helper.parseJsonToObject(buffer)
        };
   
        //Call the handler
        chosenHandler( data, ( statusCode, payload, contentType)=> {
            buffer += decoder.end();

            //set the content type default to json
            contentType = typeof(contentType)=="string" ? contentType : "json";

            //set the status code default to 200
            statusCode = typeof(statusCode)=="number" ? statusCode : 200;
            
            let payloadString = "";
            //Return the response part that are content specific
            if( contentType=="json") {
                // set payload to chosen handler or empty one
                payload = typeof( payload) == 'object' ? payload : {};
                payloadString = JSON.stringify( payload);
                //set the content type to JSON
                res.setHeader("Content-Type","applications/json");
            }
            if( contentType=="html") {
                payloadString = typeof(payload)=="string" ? payload : "";
                res.setHeader("Content-Type","text/html");
            }
            if( contentType=="css") {
                payloadString = typeof(payload)!==undefined ? payload : "";
                res.setHeader("Content-Type","text/css");
            }
            if( contentType=="favicon") {
                payloadString = typeof(payload)!==undefined ? payload : "";
                res.setHeader("Content-Type","image/x-icon");
            }
            if( contentType=="png") {
                payloadString = typeof(payload)!==undefined ? payload : "";
                res.setHeader("Content-Type","image/png");
            }
            if( contentType=="jpg") {
                payloadString = typeof(payload)!==undefined ? payload : "";
                res.setHeader("Content-Type","image/jpeg");
            }
            if( contentType=="plain") {
                payloadString = typeof(payload)!== undefined ? payload : "";
                res.setHeader("Content-Type","text/plain");
            }

            //Return response part common to all content-type
            res.writeHead( statusCode);
            res.end( payloadString);

            // log the requested route and the response
            console.log("Request received on path: ",trimmedPath);
            if( contentType=="json") {
                console.log("Response : ", statusCode, payloadString, data.payload, data.headers.token);
            }
            });
    });
    
};


// Router
server.router = new Map();
server.router.set("api/users", handler.users);
//The tokens endpoint could be optional
server.router.set("api/tokens", handler.tokens);

//Map login & logout API endpoints
server.router.set("api/login", handler.login);
server.router.set("api/logout", handler.logout);

//Map menu
server.router.set("api/menu", handler.menu);

//Map cart
server.router.set("api/cart", handler.cart);

//Map order
server.router.set("api/order", handler.order);

//Web Routes
server.router.set("favicon.ico", handler.favicon);
server.router.set("public", handler.public);

server.router.set("", handler.index);
server.router.set("account/create", handler.createAccount);
server.router.set("session/create", handler.sessionCreate);
server.router.set("session/delete", handler.sessionDelete);
server.router.set("account/edit", handler.accountEdit)
server.router.set("account/delete", handler.accountDelete);
server.router.set("menu/list", handler.menuList);
server.router.set("cart/list", handler.cartList);
server.router.set("cart/delete", handler.cartDelete);
server.router.set("order/list", handler.orderList);


//Init function
server.init = ()=>{
    // reply on http
    server.http.listen( config.httpPort, "localhost", ()=>{
        console.log('\x1b[36m%s\x1b[0m',"Server escuchando en puerto ", config.httpPort," configuracion para ", config.envName);
    });

    //reply on https
    server.https.listen( config.httpsPort, "localhost", ()=>{
        console.log('\x1b[35m%s\x1b[0m',"Server escuchando en puerto ", config.httpsPort," configuracion para ", config.envName);
    });
};

//export the server
module.exports = server;