/* CLI Tasks */


//Dependencies
const readline = require("readline");
const util = require("util");
const debug = util.debug("cli");
const events = require("events");
const config = require("./config");
const menu = require("./menu");
const _data = require("./data");

class _events extends events{};

let evt = new _events();

//cli instance
let cli = {};


//Input handler
evt.on('help', ( str)=>{
    cli.responder.help();
});
evt.on('menu', ( str)=>{
    cli.responder.menu();
});
evt.on('recent orders', ( str)=>{
    cli.responder.recentOrders();
});
evt.on('order details', ( str)=>{
    cli.responder.orderDetail( str);
});
evt.on('users new', ( str)=>{
    cli.responder.newUsers();
});
evt.on('user details', ( str)=>{
    cli.responder.userDetails( str);
});
evt.on('exit', ( str)=>{
    cli.responder.exit( str);
});

//Responder
cli.responder = {};

//Help
cli.responder.help = () => {
    let commands = {'help':'Print this help message', 
                    'menu':'View all the current menu items',
                    'recent orders':'View all orders placed in the last 24 hours',
                    'order details --{orderId}':'Lookup the details of the order with the specified ID',
                    'users new':'View all users who sign up in the last 24 hours',
                    'user details --{userEmail}':'Lookup the details of the user with the specified Email',
                    'exit':'Terminate the application'};
    cli.horizontalLine();
    cli.center( 'CLI Manual');
    cli.horizontalLine();
    cli.verticalSpace(2);
    //Print commands with their explanation
    for(let key in commands) {
        let value = commands[key];
        let line = '\x1b[33m' + key + '\x1b[0m';
        let padding = 60 - line.length;
        for( i=0; i < padding; i++) {
            line += ' ';
        }
        line += value;
        console.log(line);
        cli.verticalSpace();
    }
    cli.verticalSpace(2);
    cli.horizontalLine();
}

//CLI screen functions

//print horizontal line
cli.horizontalLine = () => {
    let width = process.stdout.columns;
    let line = '';
    for(i = 0; i<width; i++) {
        line += '-';
    }
    console.log(line);
}

//Print vertical space
cli.verticalSpace = (lines) => {
    lines = typeof(lines)=="number" && lines.length>0 ? lines : 1;
    for( i=0; i<lines; i++) {
        console.log('');
    }
}

// print text centered on the screen
cli.center = ( str) => {
    str = typeof(str)=="string" && str.trim().length>0 ? str.trim():'';
    let width = process.stdout.columns;
    let leftpadding = Math.floor((width-str.length)/2);
    let linepadding = '';
    for(i=0; i< leftpadding; i++) {
        linepadding += ' ';
    }
    console.log(linepadding + str);

}

//Menu
cli.responder.menu = () => {
    cli.verticalSpace();
    menu.forEach( (item)=>{
        let line = `Menu Id:${item.id} Product:${item.item} Value:$${item.value}`;
        console.log(line);
    });
    cli.verticalSpace();
}

//Recent Orders
cli.responder.recentOrders = () => {
    _data.list('orders', (err, ordersid)=>{
        cli.verticalSpace();
        if(!err && ordersid && ordersid.length>0) {
            ordersid.forEach(( orderid) => {
                _data.read("orders", orderid, (err, orderdata)=>{
                    if(!err && orderdata) {
                        var hours = Math.abs(Date.now() - new Date(orderdata.date)) / 36e5;
                        if( hours<=24) {
                            let NoItems = typeof(orderdata.items)=='object' && orderdata.items.length>0 ? orderdata.items.length : 0;
                            let line=`Oder Id: ${orderdata.id} Value: ${orderdata.value} Paid: ${orderdata.paymentstatus} Numbers of Items ${NoItems}`;
                            console.log(line);
                            cli.verticalSpace();
                        }
                    }
                });
            });
        }
    });
}

//Order Detail
cli.responder.orderDetail = (str) => {
    //get order id from str
    let orderid = typeof(str.split('--')[1])=='string' && str.split('--')[1].trim().length>0 ? str.split('--')[1].trim() : false;
    if(orderid) {
        _data.read("orders", orderid, (err, orderdata)=>{
            if(!err && orderdata) {
                cli.verticalSpace();
                console.dir( orderdata, {'colors':true});
                cli.verticalSpace();
            }
        });
    }
}

//New Users
cli.responder.newUsers = () => {
    _data.list('users', (err, usersid)=>{
        cli.verticalSpace();
        if(!err && usersid && usersid.length>0) {
            usersid.forEach(( userid) => {
                _data.read("users", userid, (err, userdata)=>{
                    if(!err && userdata) {
                        var hours = Math.abs(Date.now() - new Date(userdata.signupdate)) / 36e5;
                        if( hours<=24) {
                            let NoOrders = typeof(userdata.orders)=='object' && orderdata.orders.length>0 ? orderdata.orders.length : 0;
                            let line=`Email: ${userdata.email} Name: ${userdata.name} Sign Up: ${new Date(userdata.signupdate)} Numbers of Orders ${NoOrders}`;
                            console.log(line);
                            cli.verticalSpace();
                        }
                    }
                });
            });
        }
    });
}

//User details
cli.responder.userDetails = ( str) => {
     //get user id from str
     let userid = typeof(str.split('--')[1])=='string' && str.split('--')[1].trim().length>0 ? str.split('--')[1].trim() : false;
     if(userid) {
         _data.read("users", userid, (err, userdata)=>{
             if(!err && userdata) {
                 //hide hashed password
                delete(userdata.hashedPassword);
                 cli.verticalSpace();
                 console.dir( userdata, {'colors':true});
                 cli.verticalSpace();
             }
         });
     }
}

//Exit
cli.responder.exit = () => {
    process.exit(0);
}


//input processor
cli.processInput = ( str) => {
    str = typeof(str)=="string" && str.length>0 ? str.trim() : false;

    if(str) {
        var commands = ['help', 'menu', 'recent orders', 'order details', 'users new', 'user details', 'exit'];

        //emit an event when match is found
        let matchFound = false;
        let counter = 0;

       commands.some( ( cmd )=> {
           if(str.toLowerCase().indexOf( cmd)>-1) {
               matchFound = true;
               //emit match command
               evt.emit( cmd, str);
               return true;
            }
       });

       if (!matchFound) {
           console.log("Sorry try again");
       }

    }

}

cli.init = () => {
    // send the ready message to console
    console.log("\x1b[34m%s\x1b[0m", `The CLI is listening on ${config.httpPort}`);

    //start console interface
    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ">"
    });

    //create prompt
    _interface.prompt();

    //handle input
    _interface.on('line', ( str)=> {
        cli.processInput( str);

        //re-initialize prompt after input
        _interface.prompt();
    });

    _interface.on("close", () => {
        process.exit(0);
    });

}



module.exports = cli;
