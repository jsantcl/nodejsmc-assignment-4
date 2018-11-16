/*
* Handlers for all the defined paths
*
*
*/


//dependencies
const config = require("./config");
const helper = require("./helpers");
const _data = require("./data");

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
            callback(400,{"Error":"Missing required field"})
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
//required field email
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
                            //delete all checks associated with the user
                            
                            //let userchecks = typeof( userdata.checks)=="object" && userdata.checks instanceof Array ? userdata.checks : [];
                            //let checksToDelete= userchecks.length;
                            //let checksDeleted = 0;
                            //let deletionErros=false;
                            /*if(checksToDelete>0) {
                                //loop through the cheks
                                userchecks.forEach((checkid) => {
                                    _data.delete("checks", checkid, (err)=> {
                                        if(err) {
                                            deletionErros = true;
                                        } else {
                                            checksDeleted++;
                                            if(checksDeleted==checksToDelete) {
                                                if(!deletionErros) {
                                                    callback(200);
                                                } else {
                                                    callback(500,{"Error":"Error while attempting to delete checks"});
                                                }
                                            }
                                        }
                                    });
                                });
                            } else {
                                callback(200);
                            }*/
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

// Not found handler
handlers.notFound = (data, callback)=> {
    callback( 404);
};

module.exports = handlers;