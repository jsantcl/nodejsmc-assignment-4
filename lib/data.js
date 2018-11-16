/*
*
* Data API
*
*/


// dependencies

const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");


//conteiner for module to export
let lib = {};


// base directory of .data
lib.basedir = path.join( __dirname, "/../.data/");

// create file function
lib.create = ( dir, file, data, callback)=>{
    //open file for writing
    fs.open( lib.basedir + dir + "/" + file + ".json","wx",(err, fileDescriptor)=>{
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify( data);

            // write file and close
            fs.writeFile( fileDescriptor, stringData, (err)=>{
                if(!err){
                    fs.close( fileDescriptor, (err)=>{
                        if(!err) {
                            callback( false)
                        } else {
                            callback(`Error closing new file: ${file}`);
                        }
                    });
                } else {
                    callback(`Error writing to new file: ${file}`);
                }
            });
        } else {
            callback(`Could not create new file: ${file} it may already exists`);
        }
    });
};

//read a file
lib.read = ( dir, file, callback)=>{
    fs.readFile( lib.basedir + dir + "/" + file + ".json", "utf8", (err, data)=>{
        if(!err && data) {
            var parsedData=helpers.parseJsonToObject( data);
            callback( false, parsedData);

        } else {
            callback( err, data);
        }
        
    });
};

//update file
lib.update = ( dir, file, data, callback)=>{
    //open file for reading
    fs.open( lib.basedir + dir + "/" + file + ".json","r+",(err, fileDescriptor)=>{
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify( data);
            fs.truncate( fileDescriptor, (err)=>{
                if(!err) {
                    fs.writeFile( fileDescriptor, stringData, (err)=>{
                        if(!err){
                            fs.close( fileDescriptor, (err)=>{
                                if(!err) {
                                    callback( false)
                                } else {
                                    callback(`Error closing file: ${file}`);
                                }
                            });
                        } else {
                            callback(`Error writing to file: ${file}`);
                        }
                    });     
                } else {
                    callback(`Error truncating file ${file}`)
                }
            });
        } else {
            callback(`Error opening file ${file}`);
        }
    });
};

//delete file
lib.delete = (dir, file, callback)=>{
    fs.unlink( lib.basedir + dir + "/" + file + ".json", (err)=>{
        if(!err) {
            callback( false);
        } else {
            callback(`Error deleting file ${file}`);
        }
    });
}


//read all files in a data directory
lib.list = (dir, callback)=>{
    fs.readdir(lib.basedir + "/" + dir + "/", (err, dirdata)=>{
        if(!err && dirdata && dirdata.length>0) {
            let trimmedFileNames = [];
            dirdata.forEach( (filename)=>{
                trimmedFileNames.push( filename.replace(".json",""));
            });
            callback( false, trimmedFileNames);
        } else {
            callback(err, dirdata);
        }
    });
};


module.exports = lib;