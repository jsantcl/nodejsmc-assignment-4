/*
Library for storing and rotating logs
*/

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");


//lib container
let lib = {};

// base directory of .logs
lib.basedir = path.join( __dirname, "/../.logs/");


//append string to file, create if not exists
lib.append = ( filename, str, callback) => {
//open the file for append
fs.open( lib.basedir + filename, 'a', (err, fileDescriptor) => {
    if(!err && fileDescriptor) {
        
        //append to file and close
        fs.appendFile( fileDescriptor, str + '\n', (err) => {
            if(!err) {
                fs.close( fileDescriptor, (err)=>{
                    if(!err) {
                        callback( false);
                    } else {
                        callback("Error closing log file "+ lib.basedir + filename);
                    }
                });
            } else {
                callback("Error appending to log file " + lib.basedir + filename);
            }
        });
    } else {
        callback("Error Opening Log File: " + lib.basedir + filename)
    }
});
};

module.exports = lib;