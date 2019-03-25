/*
*
* Main File
*
*/

//Dependencies
const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");

let app = {};

//init function
app.init = ()=>{
    //start the server
    server.init();

    //start the workers
    workers.init();

    //start the CLI
    setTimeout( ()=> {
        cli.init();
    }, 50);
};



//execute function
app.init();


module.exports = app;