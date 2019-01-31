/*
*
* Main File
*
*/

//Dependencies
const server = require("./lib/server");
const workers = require("./lib/workers");
let app = {};

//init function
app.init = ()=>{
    //start the server
    server.init();

    //start the workers
    workers.init();
};



//execute function
app.init();


module.exports = app;