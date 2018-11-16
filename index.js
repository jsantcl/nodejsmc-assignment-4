/*
*
* Main File
*
*/

//Dependencies
const server = require("./lib/server");

let app = {};

//init function
app.init = ()=>{
    //start the server
    server.init();
};

//execute function
app.init();


module.exports = app;