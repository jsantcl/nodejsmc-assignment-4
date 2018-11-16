/*
* Helper for various task
*
*
*/

//Dependencies
const crypto = require("crypto");
const config = require("./config");

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


module.exports = helpers;
