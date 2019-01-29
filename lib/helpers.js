/*
* Helper for various task
*
*
*/

//Dependencies
const crypto = require("crypto");
const config = require("./config");
const https = require("https");
const querystring = require("querystring");
const StringDecoder = require("string_decoder");
const path = require("path");
const fs = require("fs");

var helpers = {};

helpers.hash = ( str)=>{
    if( typeof(str)=="string" && str.length>0) {
        const hash = crypto.createHmac( "sha256", config.hashingSecret).update( str).digest("hex");
        return hash;
    } else {
        return false;
    }
}

helpers.parseJsonToObject = ( str)=> {
    try {
        var obj = JSON.parse( str);
    } catch( e) {
        return {};
    }
    return obj;
}

helpers.isEmail = ( email) => {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test( email))
    {
        return true;
    }
    return false;
};


//crate a string of random alphanumeric character of the given strLength
helpers.createRandomString = ( strLength) => {
    if(typeof(strLength)=="number" && strLength>0) {
        //define characters that could go into the string
        const alphabet="abcdefghijklmnopqrstuvwxyz0123456789";
        let str = "";
        for(let i =1; i<=strLength; i++) {
            //get a character from alphabet
            let possibleCharacter = alphabet.charAt( Math.floor(Math.random() * alphabet.length));
            //appende to the string 
            str+=possibleCharacter;
        }
        return str;
    } else {
        return false;
    }
}


// Process the payment using stripe API
//required data: amount, currency, customer, description - optional data: none
helpers.stripePayment = (amount, currency, customer, description, callback) => {
    //validate input data
    amount=typeof(amount)=="number" && amount>=1 ? amount : false;
    currency=typeof(currency)=="string" && currency.trim().length==3 ? currency : false;
    customer=typeof(customer)=="string" && customer.trim().length>=config.minStrLen ? customer : false;
    description=typeof( description)=="string" && description.trim().length>=config.minStrLen ? description :false;
   
    if(amount && currency && customer && description) {
        //create the charge object for stripe
        let charge={
            "amount": amount,
            "currency": currency,
            "source": "tok_mastercard",
            "description": description + ` Customer: ${customer}`
        }

        let stringCharge = querystring.stringify( charge);

        // Configure the request details
        var requestDetails = {
            'protocol' : config.paymentAPI.protocol,
            'hostname' : config.paymentAPI.hostname,
            'method' : config.paymentAPI.method.toUpperCase(),
            'path' : config.paymentAPI.path,
            'auth' : config.paymentAPI.auth,
            'headers' : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringCharge)
            }
        };
        

        // Instantiate the request object
        let req = https.request(requestDetails,(res) => {
            // Grab the status of the sent request
            var status =  res.statusCode;
            
            //process response
            const decoder = new StringDecoder.StringDecoder("utf-8");
            let buffer = "";
            let paymentdata = {};

            res.on("data",(data)=>{
                buffer += data;
            });

            res.on("end", ()=>{
                buffer += decoder.end();
                paymentdata = helpers.parseJsonToObject( buffer);

                // Callback successfully if the request went through and res is done
                if(status == 200 || status == 201){
                    callback(false, paymentdata);
                } else {
                    callback(`Status code returned was ${status}`);
                }
            });
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error',(err)=> {
            callback(err, false);
        });

        // Add the payload
        req.write(stringCharge);

        // End the request- Ending the request sends it off
        req.end();
    } else {
        callback("Missing or invalid parameter", false);
    }
};

//Get the string content of the template
helpers.getTemplate = ( templateName, dataObject, callback)=>{
    templateName = typeof(templateName)=="string" && templateName.length > 0 ? templateName : false;
    dataObject = typeof( dataObject) == "object" && dataObject!==null ? dataObject : {};
    if( templateName) {
        let templateDir = path.join( __dirname + "/../templates/");
        fs.readFile(templateDir + templateName + ".html", "utf8", (err, str)=>{
            if(!err && str && str.length > 0) {
                let finalStr = helpers.interpolate( str, dataObject);
                callback( false, finalStr);
            } else {
                callback("No template could be found!");
            }
        });
    } else {
        callback( "A valid template name was not specified");
    }
};

//add the header and footer to string passing data Object for interpolation
helpers.addUniversalTemplates = ( str, dataObject, callback) =>{
    str = typeof(str)=="string" && str.length > 0 ? str : "";
    dataObject = typeof( dataObject) == "object" && dataObject!==null ? dataObject : {};

    helpers.getTemplate( "_header", dataObject, (err, headerString) =>{
        if(!err && headerString) {
            helpers.getTemplate("_footer", dataObject, (err, footerSrting)=>{
                if(!err && footerSrting) {
                    let fullString = headerString + str + footerSrting;
                    callback(false, fullString);
                } else {
                    callback("Could not fund the footer template")
                }
            });
        } else {
            callback( "Could not find header template");
        }
    });
};

//Take a given string and a data object and find/replace all the keys within it 
helpers.interpolate = (str, dataObject)=> {
    str = typeof(str)=="string" && str.length > 0 ? str : "";
    dataObject = typeof( dataObject) == "object" && dataObject!==null ? dataObject : {};

    //add the template globals to the data object
    for( let keyName in config.templateGlobals) {
        if( config.templateGlobals.hasOwnProperty(keyName)) {
            dataObject['global.'+keyName] = config.templateGlobals[keyName];
        }
    }

    //insert in the template string every key in data object
    for( let key in dataObject) {
        if( dataObject.hasOwnProperty( key) && typeof( dataObject[key])=="string") {
            let replace = dataObject[ key];
            let find = "{"+key+"}";
            str = str.replace( find, replace);
        }
    }

    return str;
};

//get the content of static public assets
helpers.getStaticAssets= ( filename, callback) => {
    filename = typeof(filename)=="string" && filename.length > 0 ? filename : false;
    if( filename) {
        let publicDir = path.join(__dirname + "/../public/");
        fs.readFile( publicDir + filename, (err, data)=>{
            if(!err && data) {
                callback( false, data);
            } else {
                callback("No file could be found");
            }
        });
    } else {
        callback("File not found");
    }
}

module.exports = helpers;
