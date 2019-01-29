/*
* Handlers for all the defined paths
* JSON API Handlers
*
*/


//dependencies
const config = require("./config");
const helper = require("./helpers");
const _data = require("./data");
const menu = require("./menu");

// main handler container
var handlers = {};

// Main hanlder for /users
handlers.users = (data, callback) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if( acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method]( data, callback);
    } else {
        callback( 405);
    }
}

//sub-handler for users
handlers._users = {};

//User - POST
// required data: name, email, streetaddress, password
handlers._users.post = ( data, callback)=> {
    //check required data
    const name = typeof(data.payload.name)=="string" && data.payload.name.trim().length >= config.minStrLen ? data.payload.name.trim() : false;
    const email = typeof(data.payload.email)=="string" && helper.isEmail( data.payload.email.trim()) ? data.payload.email.trim() : false;
    const streetaddress = typeof(data.payload.streetaddress)=="string" && data.payload.streetaddress.trim().length >= config.minStrLen ? data.payload.streetaddress.trim() : false;
    const password = typeof(data.payload.password)=="string" && data.payload.password.trim().length >= config.minStrLen ? data.payload.password.trim() : false;
    
    if( name && email && streetaddress && password) {
        // verify no user exist with the given email
        _data.read( "users", email, ( err, userdata)=> {
            if( err) {
                let hashedPassword = helper.hash( password);
                if( hashedPassword) {
                    const newUser = {
                        "name":name,
                        "email":email,
                        "streetaddress":streetaddress,
                        "hashedPassword":hashedPassword
                    };
                    //save the new user
                    _data.create("users", email, newUser, (err)=>{
                        if(!err) {
                            callback( 201);
                        } else {
                            callback(500, {"Error":`Could not save the new user`});
                        }
                    });
                } else {
                    callback(500, {"Error":"Could not hash user\'s password"});
                }
            } else {
                callback(400, {"Error":`User with email ${email} already exists`});
            }
        });
    } else {
        callback(400, {"Error":"Missing or invalid required fields"});
    }
    
};

// User - GET
//required data phonenumber, optional data none
handlers._users.get = (data, callback)=>{
    
    //check email provided is valid
    const email = typeof(data.querystring.email)=="string" && helper.isEmail(data.querystring.email.trim()) ? data.querystring.email.trim() : false;

        if(email) {
            //get the authorization token from headers
            const token = typeof(data.headers.token)=="string" ? data.headers.token : false;
    
            //verify the given token is valid
            handlers._tokens.verifyToken( token, email, (tokenIsValid)=>{
            if( tokenIsValid) {
                //lookup the user
            _data.read("users", email, (err, userdata)=>{
                if(!err && userdata) {
                    //remove the hashedpassword from the user object before returning to requestor
                    delete userdata.hashedPassword;
                    callback(200, userdata);
                } else {
                    callback(404);
                }
            });
            } else {
                callback(403,{"Error":"Missing required token in headers or token is invalid"});
            }
            });
            
        } else {
            callback(403,{"Error":"Missing required field"})
        }
};

//User - PUT
//required data is email, and optional data is name, streetaddress or password (at least one must be specified)
handlers._users.put = (data, callback)=>{
    
    //check email provided is valid
    const email = typeof(data.payload.email)=="string" && helper.isEmail( data.payload.email.trim()) ? data.payload.email.trim() : false;
    //Optionals
    const name = typeof(data.payload.name)=="string" && data.payload.name.trim().length >= config.minStrLen ? data.payload.name.trim() : false;
    const streetaddress = typeof(data.payload.streetaddress)=="string" && data.payload.streetaddress.trim().length >= config.minStrLen ? data.payload.streetaddress.trim() : false;
    const password = typeof(data.payload.password)=="string" && data.payload.password.trim().length >= config.minStrLen ? data.payload.password.trim() : false;
    
    if(email) {
        if(name || streetaddress || password) {

            //get the authorization token from headers
            const token = typeof(data.headers.token)=="string" ? data.headers.token : false;
                
            //verify the given token is valid
            handlers._tokens.verifyToken( token, email, (tokenIsValid)=>{
                if( tokenIsValid) {
                     //lookup user
            _data.read("users", email, (err, userdata)=>{
                if(!err && userdata) {
                    // updata fields
                    if(name) {
                        userdata.name = name;
                    }
                    if(streetaddress){
                        userdata.streetaddress = streetaddress;
                    }
                    if(password) {
                        userdata.hashedPassword=helper.hash( password)
                    }
                    //store the update
                    _data.update("users", email, userdata, (err)=>{
                        if(!err) {
                            callback(201);
                        } else {
                            callback(500, err);
                        }
                    })
                } else {
                    callback(400, {"Error":"Specified user does not exists"});
                }
            });     
                } else {
                    callback(403,{"Error":"Missing required token in headers or token is invalid"});
                }
            });
        } else {
            callback(400,{"Error":"Missing fields to update"});
        }
    } else {
        callback(400,{"Error":"Missing required field"})
    }
};

// User - DELETE
//required data email and valid token
handlers._users.delete = (data, callback)=>{
    
    const email = typeof(data.payload.email)=="string" && helper.isEmail( data.payload.email.trim()) ? data.payload.email.trim() : false;
    
    if(email) {
        //get the authorization token from headers
        const token = typeof(data.headers.token)=="string" ? data.headers.token : false;
    
        //verify the given token is valid
        handlers._tokens.verifyToken( token, email, (tokenIsValid)=>{
        if( tokenIsValid) {
            _data.read("users", email, (err, userdata)=>{
                if(!err && userdata) {
                    _data.delete("users", email, (err)=>{
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500,{"Error":"Could not delete the specified user"});
                        }
                    })
                } else {
                    callback(404, {"Error":"Could not find specified user"});
                }
            });
        } else {
            callback(403,{"Error":"Missing required token in headers or token is invalid"});
        }
        });
        
    } else {
        callback(400,{"Error":"Missing required field"});
    }
}

// Main handler for /token
handlers.tokens = (data, callback) => {
    const acceptableMethods = ["post", "get", "put", "delete"];
    if( acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method]( data, callback);
    } else {
        callback( 405);
    }
}
//sub-handler for token
handlers._tokens = {};
//Token - POST
//required data: email, password - optional data: none
handlers._tokens.post=(data, callback)=>{
    //parse email and password
    const email = typeof(data.payload.email)=="string" && helper.isEmail( data.payload.email.trim()) ? data.payload.email.trim() : false;
    const password = typeof(data.payload.password)=="string" && data.payload.password.trim().length >= config.minStrLen ? data.payload.password.trim() : false;
    
    if(email && password) {
        //lookup for email and password provided
        _data.read("users", email, (err, userdata)=>{
            if(!err) {
                //hash the received password and compare to stored password
                const hashsentpassword=helper.hash( password);
                if(hashsentpassword==userdata.hashedPassword) {
                    //password is valid create a new token, expiration in config.tokenExpTime
                    const tokenid = helper.createRandomString( config.tokenLength);
                    const expires = Date.now() + 1000 * 60 * 60 * config.tokenExpTime;
                    const tokenObject = {
                        "email":email,
                        "id":tokenid,
                        "expires":expires
                    };
                    _data.create("tokens", tokenid, tokenObject, (err)=> {
                        if(!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {"Error":"Could not create the new token"});
                        }
                    })
                } else {
                    callback(400,{"Error":"Password did not match the specified user stored password"})
                }
            } else {
                callback(400, {"Error":"Could not find the specified user"});
            }
        })
    } else {
        callback(404, {"Error":"Missing Required Fields"});
    }


};

//Token - GET
//required data is tokenid, optional data none
handlers._tokens.get=(data, callback)=>{
    
    const id = typeof(data.querystring.id)=="string" && data.querystring.id.trim().length==config.tokenLength ? data.querystring.id.trim() : false;
    
    if(id) {
        //check tokenid received is valid
        _data.read("tokens", id, (err, tokendata)=>{
            if(!err && tokendata) {
                callback(200, tokendata);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400,{"Error":"Missing required field"})
    }

}

//Token - PUT
//required data id (token), extend - optional data none
handlers._tokens.put=(data, callback)=>{
    const id = typeof(data.payload.id)=="string" && data.payload.id.trim().length==config.tokenLength ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend)=="boolean" && data.payload.extend ? true : false;
    if(id && extend) {
        _data.read("tokens", id, (err, tokendata)=>{
            if(!err && tokendata) {
                //check if token isn't already expired
                if(tokendata.expires>Date.now()) {
                    //renew the expiration time
                    tokendata.expires = Date.now() + 1000 * 60 * 60 * config.tokenExpTime;
                    //store the new update
                    _data.update("tokens", id, tokendata, (err)=>{
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {"Error":"Could not update the token expiration"});
                        }
                    })
                } else {
                    callback(400,{"Error":"Token already expired, cannot be extended"});
                }

            } else {
                callback(400, {"Error":"Token does not exists"});
            }
        })

    } else {
        callback(400,{"Error":"Missing required fields or fields are invalid"});
    }
}

//Token - DELETE
//required data id (token), optional data none
handlers._tokens.delete=(data, callback)=>{
    const id = typeof(data.querystring.id)=="string" && data.querystring.id.trim().length==config.tokenLength ? data.querystring.id.trim() : false;
    
    if(id) {
        //lookup token
        _data.read("tokens", id, (err, tokendata)=>{
            if(!err && tokendata) {
                _data.delete("tokens", id, (err)=>{
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500,{"Error":"Could not delete the specified token"});
                    }
                })
            } else {
                callback(404, {"Error":"Could not find specified token"});
            }
        })
    } else {
        callback(400,{"Error":"Missing required field"})
    } 
}

//verify if provided tokenid is valid for a given user
handlers._tokens.verifyToken=( id, email, callback)=>{
    //lookup the token
    _data.read("tokens", id, (err, tokendata)=>{
        if(!err && tokendata) {
            if(tokendata.email=email && tokendata.expires>Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    })
}


// Login & Logout endpoint
// wrapper for token post-put and delete
handlers.login = (data, callback) => {
    const acceptableMethods = ["post","put"];
    if( acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method]( data, callback);
    } else {
        callback( 405);
    }
}
handlers.logout = (data, callback) => {
    const acceptableMethods = ["delete"];
    if( acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method]( data, callback);
    } else {
        callback( 405);
    }
}


//Menu Handler Return the hard coded menu items
//Required data: valid token (aka logged in user)
handlers.menu = (data, callback) => {
    const acceptableMethods = ["get"];
    if( acceptableMethods.indexOf(data.method) > -1) {
            // get token from header
            const tokenid = typeof(data.headers.token)=="string" ? data.headers.token : false;
            //read the token data
            _data.read("tokens", tokenid, (err, tokendata)=>{
                if(!err && tokendata) {
                    //verify the given token is valid
                    handlers._tokens.verifyToken( tokenid, tokendata.email, (tokenIsValid)=>{
                        if( tokenIsValid) {
                            //If token is valid and not expired return the menu
                            callback(200, menu);
                        } else {
                            callback(403,{"Error":"Token is invalid"});
                        }
                    });
                } else {
                    callback(400, {"Error":"Missing required Token or token is invalid"});
                }
            });
    } 
     else {
        callback( 405);
    }
};


//Cart Main Handler
handlers.cart = (data, callback)=>{
    const acceptableMethods = ["post","get","put","delete"];
    if( acceptableMethods.indexOf(data.method) > -1) {
        handlers._cart[data.method]( data, callback);
    } else {
        callback( 405);
    }
};

//Cart sub-handler
handlers._cart={};

//Cart - POST
//required data: email, valid token, at least one item - optional data: none
handlers._cart.post = (data, callback)=>{
    //validate required data
    const email = typeof(data.payload.email)=="string" && helper.isEmail(data.payload.email.trim()) ? data.payload.email.trim() : false;
    const items = typeof(data.payload.items)=="object" && data.payload.items instanceof Array && data.payload.items.length>=1 && data.payload.items.length<=config.maxCartItems ? data.payload.items : false;


    if(email && items) {
        // get token from header
        const token = typeof(data.headers.token)=="string" ? data.headers.token : false;
        handlers._tokens.verifyToken( token, email, (tokenIsValid)=>{
            if(tokenIsValid) {
                let itemInMenu = false;
                let validItems = [];
                let notValidItems = [];
                
                
                    //get the user data
                    _data.read("users", email, (err, userdata)=>{
                        if(!err && userdata) {
                            let usercarts = typeof( userdata.carts)=="object" && userdata.carts instanceof Array ? userdata.carts : [];
                           if(usercarts.length<config.maxCartNumber) {
                               // Check the requested menu items exists in the menu push valid items to new array
                                items.forEach( cartItem => {
                                    itemInMenu = menu.find( (menuitem) => {
                                        return menuitem.id==cartItem.id;
                                    });
                                    if(itemInMenu) {
                                        cartItem.item = itemInMenu.item;
                                        cartItem.value = itemInMenu.value;
                                        validItems.push( cartItem);
                                    } else {
                                        notValidItems.push( cartItem);
                                    }
                                });
                                if( validItems.length==items.length) {
                                    //All requested items are in the menu, then save the cart and save it's cartid to user profile
                                    //random id for the cart
                                    let cartid=helper.createRandomString(config.cartIdLength);
                                    let newCart = {
                                        id:cartid,
                                        email:email,
                                        items:validItems
                                    }
                                    _data.create("carts", cartid, newCart, (err)=>{
                                        if(!err) {
                                            usercarts.push( cartid);
                                            userdata.carts=usercarts;
                                            _data.update("users", email, userdata, (err)=>{
                                                if(!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {"Error":"Could not save the cart data in the user profile"});
                                                }
                                            });           
                                        } else {
                                            callback(500, {"Error":"Error saving cart"});
                                        }
                                    });
                                } else {
                                    callback(400,{"Error":`One or more of the requested items are not in the menu ${JSON.stringify(notValidItems)}`});
                                }
                            } else {
                                callback(400, {"Error":"The user already have a cart created"});
                            }
                        }
                    });
            } else {
                callback(403,{"Error":"Missing required token in headers or token is invalid"});
            }
        });
        
    } else {
        callback(400, {"Error":"Missing required fields"});
    }
}


//Cart - GET 
//required data: valid token, cartid - optional data: none
handlers._cart.get = (data, callback)=>{
    //get the cartid
    const cartid = typeof( data.querystring.id)=="string" && data.querystring.id.trim().length==config.cartIdLength ? data.querystring.id.trim() : false;
    
    if( cartid) {
        _data.read("carts", cartid, (err, cartdata)=>{
            if(!err && cartdata) {
                // get token from header
                const token = typeof(data.headers.token)=="string" ? data.headers.token : false;
                handlers._tokens.verifyToken( token, cartdata.email, (tokenIsValid)=>{
                    if(tokenIsValid) {
                        callback(200, cartdata);
                    } else {
                        callback(403,{"Error":"Missing required token in headers or token is invalid"});
                    }
                });
            } else {
                callback(500,{"Error":"Error getting cart information"});
            }
        });
    } else {
        callback(400, {"Error":"Missing required fields"});
    }
};


//Cart - PUT
//requried data: valid token, cartid, at least one item
handlers._cart.put = (data, callback)=>{
    //get the cartid and items
    const cartid = typeof( data.payload.id)=="string" && data.payload.id.trim().length==config.cartIdLength ? data.payload.id.trim() : false;
    const items = typeof(data.payload.items)=="object" && data.payload.items instanceof Array && data.payload.items.length>=1 ? data.payload.items : false;
    if( cartid && items) {
        //read the cart data
        _data.read("carts", cartid, (err, cartdata)=>{
            if(!err && cartdata) {
                //get token from headers and validate
                const tokenid = typeof(data.headers.token)=="string" ? data.headers.token : false;
                handlers._tokens.verifyToken( tokenid, cartdata.email, (tokenIsValid)=>{
                    if(tokenIsValid) {
                        //validate and update the cart data with the items sent by user
                        let itemInMenu = false;
                        let validItems = [];
                        let notValidItems = [];
                        // Check the requested menu items exists in the menu push valid items to new array
                        items.forEach( cartItem => {
                            itemInMenu = menu.find( (menuitem) => {
                            return menuitem.id==cartItem.id;
                        });
                            if(itemInMenu) {
                                cartItem.item = itemInMenu.item;
                                cartItem.value = itemInMenu.value;
                                validItems.push( cartItem);
                            } else {
                                notValidItems.push( cartItem);
                            }
                        });
                        //check if valid items is the same as send by user
                        if( validItems.length == items.length) {
                        //update the cart with the items
                            cartdata.items = validItems;
                            _data.update("carts", cartdata.id, cartdata, (err)=>{
                                if(!err) {
                                    callback(200);
                                } else {
                                    callback(500, {"Error":"Could not save the update to the cart"});
                                }
                            });
                        } else {
                            callback(400,{"Error":`One or more of the requested items are not in the menu  ${JSON.stringify(notValidItems)}`});
                        }
                
                    } else {
                        callback(400, {"Error":"Token is invalid or has expired"});
                    }
                });
            } else {
                callback(400, {"Error":"Error getting cart information"});
            }
        });
    } else {
        callback(400, {"Error":"Missing required fields"});
    }
};


//Cart - delete
//required data: valid token, cartid - optional data: none
handlers._cart.delete = (data, callback)=>{
    //get the cartid
    const cartid = typeof( data.querystring.id)=="string" && data.querystring.id.trim().length==config.cartIdLength ? data.querystring.id.trim() : false;
        
    if( cartid) {
        _data.read("carts", cartid, (err, cartdata)=>{
            if(!err && cartdata) {
                // get token from header
                const token = typeof(data.headers.token)=="string" && data.headers.token.length==config.tokenLength ? data.headers.token : false;
                handlers._tokens.verifyToken( token, cartdata.email, (tokenIsValid)=>{
                    if(tokenIsValid) {
                        //delete the cart
                        _data.delete("carts", cartid, (err)=>{
                            if(!err) {
                                //delete cart from user data
                                _data.read("users", cartdata.email, (err, userdata)=>{
                                    if(!err && userdata) {
                                        //get the user cart
                                        let usercart = typeof( userdata.carts)=="object" && userdata.carts instanceof Array ? userdata.carts : [];
                                        let cartToDelete = usercart.indexOf( cartid);
                                        if( cartToDelete>-1) {
                                            usercart.splice( cartToDelete, 1);
                                            _data.update("users", cartdata.email, userdata, (err)=>{
                                                if(!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500,{"Error":"Error could not update user\'s cart information"});
                                                }
                                            });
                                        }
                                    } else {
                                        callback(500, {"Error":"could not find the user who created the cart"});
                                    }
                                });
                            } else {
                                callback(500, {"Error":"Error deleting the cart"})
                            }
                        });
                    } else {
                        callback(403,{"Error":"Missing required token in headers or token is invalid"});
                    }
                });
            } else {
                callback(500,{"Error":"Error getting cart information"});
            }
        });
    } else {
        callback(400, {"Error":"Missing required fields"});
    }
};


//Order Main Handler
handlers.order = (data, callback) => {
    const acceptableMethods = ["post", "get"];
    if( acceptableMethods.indexOf(data.method) > -1) {
        handlers._order[data.method]( data, callback);
    } else {
        callback( 405);
    }
}

//Order sub-handler
handlers._order={};

//Order - POST
//required data: valid token, cartid, credit card number - optional data: none
//delete the cart if successfull payment
handlers._order.post = (data, callback)=>{
    
    //validate required data
    const tokenid = typeof(data.headers.token)=="string" && data.headers.token.length==config.tokenLength ? data.headers.token : false;
    const cartid = typeof(data.payload.cartid)=="string" && data.payload.cartid.trim().length==config.cartIdLength ? data.payload.cartid : false;
    const creditCard = typeof(data.payload.creditcard)=="string" && data.payload.creditcard.trim().length==config.creditCardLength ? data.payload.creditcard.trim() : false;
    const expMonth = typeof(parseInt(data.payload.expmonth))=="number" && parseInt(data.payload.expmonth)>=1 && parseInt(data.payload.expmonth)<=12 ? parseInt(data.payload.expmonth) : false;
    const expYear = typeof(parseInt(data.payload.expyear))=="number" && parseInt(data.payload.expyear)>=2018 ? parseInt(data.payload.expyear) : false;
    const cvv = typeof(parseInt(data.payload.cvv))=="number" ? parseInt(data.payload.cvv) : false;

    if( cartid && creditCard && expMonth && expYear && cvv) {
        //get customer data from cart
        _data.read("carts", cartid, (err, cartdata)=>{
            if(!err && cartdata) {
                //validate token
                handlers._tokens.verifyToken( tokenid, cartdata.email, (tokenIsValid)=>{
                    if(tokenIsValid) {
                        //calculate the total order
                        let orderValue=0;
                        cartdata.items.forEach( (cartitem)=>{
                            let menuitem = menu.find((menuitem)=>{
                                return menuitem.id==cartitem.id;
                            });
                            orderValue += cartitem.quantity * menuitem.value;
                        });
                        
                        helper.stripePayment( orderValue, config.paymentAPI.currency, cartdata.email, `Charge for order ${cartid}`, (err, paymentdata)=>{
                            if(!err && paymentdata) {
                                
                                //create an order object
                                let orderid = helper.createRandomString( config.orderIdLength);
                                let neworder = {
                                    "id": orderid,
                                    "email": cartdata.email,
                                    "value": parseInt(orderValue),
                                    "paymentstatus": paymentdata.paid,
                                    "items":cartdata.items,
                                    "date":new Date(),
                                    "emailsent": false,
                                    "paymentid": paymentdata.id
                                }
                                //save the order
                                _data.create("orders", orderid, neworder, (err)=>{
                                    if(!err) {
                                        //retrieve the orders from user profile and save the new one
                                        _data.read("users", cartdata.email, (err, userdata)=>{
                                            if(!err && userdata) {
                                                let userorders = typeof( userdata.orders)=="object" && userdata.orders instanceof Array ? userdata.orders : [];
                                                userorders.push(orderid);
                                                userdata.orders=userorders;
                                                //update user and return neworder
                                                _data.update("users", userdata.email, userdata, (err)=>{
                                                    if(!err) {
                                                        data.querystring = {
                                                            'id':cartdata.id
                                                        }
                                                        
                                                        handlers._cart.delete(data, (err)=>{
                                                            if(err==200) {
                                                                callback(200, neworder);
                                                            } else {
                                                                callback(500, {'Error':'Error removing cart after order is paid'});
                                                            }
                                                        });
                                                        
                                                    } else {
                                                        callback(500, {"Error":"Could not update user data with new order"});
                                                    }
                                                });
                                            } else {
                                                callback(500, {"Error":"Could not read user data for orders update"})
                                            }
                                        });
                                    } else {
                                        callback(500, {"Error":"Could not save the order"});
                                    }
                                });
                            } else {
                                callback(500, {"Error":`Could not process the payment for cart ${cartid} ${err}`});
                            }
                        });
                    } else {
                        callback(400, {"Error":"Token is invalid or has expired"})
                    }
                });
            } else {
                callback(400,{"Error":"Could not get cart information"})
            }
    });
    }  else {
        callback(400, {"Error":"Missing required fields"});
    }
    

}

//Order - GET
//required data: valid token, orderid - optional data: none
handlers._order.get =  (data, callback)=>{
//get order id from querystring
const orderid = typeof(data.querystring.id)=="string" && data.querystring.id.trim().length==config.orderIdLength ? data.querystring.id : false;

if( orderid) {
    //get token and verify
    const tokenid = typeof(data.headers.token)=="string" && data.headers.token.trim().length==config.tokenLength ? data.headers.token: false;
    if( tokenid) {
        //read order information an verify token
        _data.read("orders", orderid, (err, orderdata)=>{
            if(!err && orderdata) {
                handlers._tokens.verifyToken( tokenid, orderdata.email, (tokenIsValid)=>{
                    if(tokenIsValid) {
                        callback(200, orderdata);
                    } else {
                        callback(400, {"Error":"Token is invalid or has expired"});
                    }
                });
            } else {
                callback(400, {"Error":"Error reading the requested order data"});
            }
        });
    } else {
        callback(400, {"Error":"Missing required token"});
    }

} else {
    callback(400, {"Error":"Missing required parameter"});
}
};

// Not found handler
handlers.notFound = (data, callback)=> {
    callback( 404);
};


/*
*
* WEB handlers
*
*/

//Index or Home page
handlers.index = ( data, callback)=>{
    if( data.method == "get") {
        let templateData = {
            "head.title":"Pizza Shop",
            "head.description":"Description",
            "body.title":"The best pizza ever made!",
            "body.class":"index"
        }
        helper.getTemplate("index", templateData, (err, str)=>{
            if(!err && str) {
                //Add universal templates
                helper.addUniversalTemplates( str, templateData, (err, str)=>{
                    if(!err && str) {;
                        callback(200, str, "html");
                    } else {
                        callback(500, undefined, "html");
                    }
                });
            } else {
                callback(500, undefined, "html");
            }
        });
    } else {
        callback( 405, undefined, "html");
    }
};

//Create account handler
handlers.createAccount = ( data, callback)=>{
    if( data.method == "get") {
        let templateData = {
            "head.title":"New Customer",
            "head.description":"Welcome, sign in and get pizza",
            "body.class":"accountCreate"
        }
        helper.getTemplate("accountCreate", templateData, (err, str)=>{
            if(!err && str) {
                //Add universal templates
                helper.addUniversalTemplates( str, templateData, (err, str)=>{
                    if(!err && str) {;
                        callback(200, str, "html");
                    } else {
                        callback(500, undefined, "html");
                    }
                });
            } else {
                callback(500, undefined, "html");
            }
        });
    } else {
        callback( 405, undefined, "html");
    }
};

//session creation
handlers.sessionCreate = ( data, callback)=>{
    if( data.method == "get") {
        let templateData = {
            "head.title":"Login",
            "head.description":"Enter your Email and Password to login",
            "body.class":"sessionCreate"
        }
        helper.getTemplate("sessionCreate", templateData, (err, str)=>{
            if(!err && str) {
                //Add universal templates
                helper.addUniversalTemplates( str, templateData, (err, str)=>{
                    if(!err && str) {;
                        callback(200, str, "html");
                    } else {
                        callback(500, undefined, "html");
                    }
                });
            } else {
                callback(500, undefined, "html");
            }
        });
    } else {
        callback( 405, undefined, "html");
    }
};

//session deletion
handlers.sessionDelete = (data, callback)=> {
    if( data.method == "get") {
        let templateData = {
            "head.title":"Logged Out",
            "head.description":"You have been logged out of the pizza shop",
            "body.class":"sessionDelete"
        }
        helper.getTemplate("sessionDelete", templateData, (err, str)=>{
            if(!err && str) {
                //Add universal templates
                helper.addUniversalTemplates( str, templateData, (err, str)=>{
                    if(!err && str) {;
                        callback(200, str, "html");
                    } else {
                        callback(500, undefined, "html");
                    }
                });
            } else {
                callback(500, undefined, "html");
            }
        });
    } else {
        callback( 405, undefined, "html");
    }
};

//account edit
handlers.accountEdit = (data, callback) => {
    if( data.method == "get") {
        let templateData = {
            "head.title":"Edit Your Account",
            "head.description":"",
            "body.class":"accountEdit"
        }
        helper.getTemplate("accountEdit", templateData, (err, str)=>{
            if(!err && str) {
                //Add universal templates
                helper.addUniversalTemplates( str, templateData, (err, str)=>{
                    if(!err && str) {;
                        callback(200, str, "html");
                    } else {
                        callback(500, undefined, "html");
                    }
                });
            } else {
                callback(500, undefined, "html");
            }
        });
    } else {
        callback( 405, undefined, "html");
    }
};

//get here after account has been deleted
handlers.accountDelete = ( data, callback) => {
    if( data.method == "get") {
        let templateData = {
            "head.title":"Delete Your Account",
            "head.description":"Your customer accounts has been deleted",
            "body.class":"accountDelete"
        }
        helper.getTemplate("accountDelete", templateData, (err, str)=>{
            if(!err && str) {
                //Add universal templates
                helper.addUniversalTemplates( str, templateData, (err, str)=>{
                    if(!err && str) {;
                        callback(200, str, "html");
                    } else {
                        callback(500, undefined, "html");
                    }
                });
            } else {
                callback(500, undefined, "html");
            }
        });
    } else {
        callback( 405, undefined, "html");
    }
};

//menu list
handlers.menuList = (data, callback) => {
    if( data.method == "get") {
        let templateData = {
            "head.title":"Welcome Here is the menu",
            "head.description":"Select items from the menu",
            "body.class":"menuList"
        }
        helper.getTemplate("menuList", templateData, (err, str)=>{
            if(!err && str) {
                //Add universal templates
                helper.addUniversalTemplates( str, templateData, (err, str)=>{
                    if(!err && str) {;
                        callback(200, str, "html");
                    } else {
                        callback(500, undefined, "html");
                    }
                });
            } else {
                callback(500, undefined, "html");
            }
        });
    } else {
        callback( 405, undefined, "html");
    }
};
//cart list
handlers.cartList = (data, callback) => {
    if( data.method == "get") {
        let templateData = {
            "head.title":"Welcome this is Your carts list",
            "head.description":"You can operate over your carts here",
            "body.class":"cartList"
        }
        helper.getTemplate("cartList", templateData, (err, str)=>{
            if(!err && str) {
                //Add universal templates
                helper.addUniversalTemplates( str, templateData, (err, str)=>{
                    if(!err && str) {;
                        callback(200, str, "html");
                    } else {
                        callback(500, undefined, "html");
                    }
                });
            } else {
                callback(500, undefined, "html");
            }
        });
    } else {
        callback( 405, undefined, "html");
    }
}

//cart delete
handlers.cartDelete= ( data, callback) => {
    if( data.method == "get") {
        let templateData = {
            "head.title":"Deleted Your Cart",
            "head.description":"Your cart has been deleted",
            "body.class":"accountDelete"
        }
        helper.getTemplate("cartDelete", templateData, (err, str)=>{
            if(!err && str) {
                //Add universal templates
                helper.addUniversalTemplates( str, templateData, (err, str)=>{
                    if(!err && str) {;
                        callback(200, str, "html");
                    } else {
                        callback(500, undefined, "html");
                    }
                });
            } else {
                callback(500, undefined, "html");
            }
        });
    } else {
        callback( 405, undefined, "html");
    }
};

//order list
handlers.orderList = (data, callback) => {
    if( data.method == "get") {
        let templateData = {
            "head.title":"Welcome this is Your orders list",
            "head.description":"List of the orders You have paid",
            "body.class":"orderList"
        }
        helper.getTemplate("orderList", templateData, (err, str)=>{
            if(!err && str) {
                //Add universal templates
                helper.addUniversalTemplates( str, templateData, (err, str)=>{
                    if(!err && str) {;
                        callback(200, str, "html");
                    } else {
                        callback(500, undefined, "html");
                    }
                });
            } else {
                callback(500, undefined, "html");
            }
        });
    } else {
        callback( 405, undefined, "html");
    }
}

//favicon handler
handlers.favicon = ( data, callback) => {
    //Only GET method is allowed
    if(data.method.toUpperCase()=="GET") {
        //read icon data
        helper.getStaticAssets( "favicon.ico", (err, data)=>{
            if(!err && data) {
                callback(200, data, "favicon");
            } else {
                callback(500);
            }
        });
    } else {
        callback(405);
    }
}

//public assets handler
handlers.public = ( data, callback) => {
    //Only GET method is allowed
    if(data.method.toUpperCase()=="GET") {
        //get the asset name from the request path
        let trimmedAssetName = data.trimmedPath.replace("public/","").trim();
        helper.getStaticAssets( trimmedAssetName, (err, data)=>{
            if(!err && data) {
                let ContentType="plain";
                if( trimmedAssetName.indexOf(".css") > -1) {
                    ContentType = "css";
                }
                if( trimmedAssetName.indexOf(".png") > -1) {
                    ContentType = "png";
                }
                if( trimmedAssetName.indexOf(".jpg") > -1) {
                    ContentType = "jpg";
                }
                if( trimmedAssetName.indexOf(".ico") > -1) {
                    ContentType = "favicon";
                }
                callback(200, data, ContentType);
            } else {
                callback(500);
            }
        });
    } else {
        callback(400);
    }
}

module.exports = handlers;