/*
* Worker related task
*
*/

const _data = require("./data");
const https = require("https");
const helpers = require("./helpers");
const queryString = require('querystring');
const config=require("./config");
const _log = require("./logs");


//create worker container object

let worker = {};

//Verify order data before proceed with email
worker.validateOrder = ( order) => {
// validate the otder data
    const orderid = typeof(order.id)=="string" && order.id.length==config.orderIdLength ? order.id : false;   
    const email = typeof(order.email)=="string" && helpers.isEmail(order.email.trim()) ? order.email : false;
    const emailsent = typeof(order.emailsent)=="boolean" && !order.emailsent ? false : true;
    const orderpaid = typeof(order.paymentstatus)=="boolean" && order.paymentstatus ? true : false;
    // first check if the order email has been sent
    if(!emailsent) {
        if(email && orderpaid && orderid) {
          //get additional customer data
          _data.read("users", email, (err, userdata)=>{
            if(!err && userdata) {
              worker.sendEmail( order, userdata.name);
            } else {
              worker.log( Date.now(), 'validateOrder', 'error', 'Error getting customer data');
            }
          });
        } else {
          worker.log( Date.now(), 'validateOrder', 'error', 'Invalid email or order data');
        }
        
    } else {
      worker.log( Date.now(), 'validateOrder', 'information', 'Skipping order mail already sent');
    }
  };

// Send paid orders email every x minutes
worker.sendEmail = ( order, customer)=>{

  //construct the message

  //list of items
  let items='<table><tr><th>Pizza</th><th>Quantity</th><th>Value</th><th>Sub Total</th></tr>';
  for (i=0; i<order.items.length; i++) {
    items += `<tr><td>${order.items[i].item}</td><td>${parseInt(order.items[i].quantity)}</td><td>${parseInt(order.items[i].value)}</td><td>${parseInt(order.items[i].quantity)*parseInt(order.items[i].value)}</td></tr>`;
  }
  items +=`<tr><td colspan="2"></td><td>Total</td><td>${order.value}</td>`
  let message = {
    "from":"mailgun@sandbox6e6ee770314c42dd9ddf0e23f809b0d7.mailgun.org",
    "to":order.email,
    "subject":`Receipt for your order ${order.id}`,
    "text":`<h4>Hello ${customer}</h4>
    
    <p>Your order ${order.id} has been paid, the total amount charged 
    is ${config.paymentAPI.currency} ${order.value}. Thank You!</p>
    <p>Order Summary</p> 
    ` + items
  };

  console.log(items);

  let messageQueryStr = queryString.stringify( message);

    // Construct the request
    let requestDetails = {
      'protocol' : config.emailAPI.protocol,
      'hostname' : config.emailAPI.hostname,
      'method' : config.emailAPI.method,
      'path' : config.emailAPI.path,
      'auth' : config.emailAPI.auth,
      'headers' : {
      'Content-Type' : 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(messageQueryStr)
      }  
    };

    
    // Instantiate the request object
    var req = https.request(requestDetails, (res)=>{
        // Grab the status of the sent request
        var status =  res.statusCode;
        if(status==200 || status==201) {
          worker.processsEmailResult( status, order);
        } else {
          console.log(`Error sending order ${order.id} email`);
        }
    });
  
    // Bind to the error event so it doesn't get thrown
    req.on('error',(err)=> {
      console.log(`Error sending email ${err}`);
    });

    // Add the payload
    req.write(messageQueryStr);

    // End the request- Ending the request sends it off
    req.end();
  };
  
  // Process the check outcome, update the check data as needed, trigger an alert if needed
  // Special logic for accomodating a check that has never been tested before (don't alert on that one)
  worker.processsEmailResult = ( status, order) => {
    
    //set the order.emailsent value according to status code
    const emailsent = status==200 || status==201 ? true : false;

    if( emailsent) {
      order.emailsent = emailsent;
      // Save the updates to order
    _data.update('orders',order.id, order, (err) => {
      if(!err){
        worker.log( Date.now(), 'sendEmail', 'information', 'Order email status has been updated');
      } else {
        worker.log( Date.now(), 'sendEmail', 'error', 'Error trying to save updates to order');
      }
    });
    } else {
      worker.log( Date.now(), 'sendEmail', 'error', 'Email not sent no changes to order');
    }
    
  };
  

//lookup all orders, get their data, validate
worker.getAllOrders = ()=>{
    _data.list("orders", (err, orders)=>{
        if(!err && orders && orders.length>0) {
            orders.forEach(( order) => {
                _data.read("orders", order, (err, orderdata)=>{
                    if(!err && orderdata) {
                        worker.validateOrder( orderdata);
                    } else {
                      worker.log( Date.now(), 'getAllOrders', 'error', 'Error reading one of the order\'s data');
                    }
                });
            });
        } else {
          worker.log( Date.now(), 'getAllOrders', 'information', 'Could not find any orders to process');
        }
    });
};

//Log operations to file system
worker.log = (datetime, operation, status, message) => {
//assemble log data object
let logEntry = {
  datetime:datetime,
  operation: operation,
  status: status,
  message: message
}

//Convert to string to save
let logEntryStr = JSON.stringify( logEntry);

let logFileName = operation;
//Save to log
_log.append(logFileName, logEntryStr, (err)=>{
if(!err) {
  
} else {
  console.log("Loggin to file fail!!");
}
});

};

worker.loop = ()=>{
    setInterval(()=>{
        worker.getAllOrders();
    }, 1000 * 60);
};

//init script
worker.init = ()=>{
    //get orders and process
    worker.getAllOrders();
    //call the loop
    worker.loop();
};


//export the module
module.exports = worker;