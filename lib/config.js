/*
* Create and export configuration
*/

// container for environments

var environments={};

//staging (default)
environments.staging={
    envName:"Staging",
    httpPort:3000,
    httpsPort:3001,
    hashingSecret:"well who's secret is it",
    minStrLen: 5,
    tokenExpTime: 5, //Hours
    tokenLength: 20,
    cartIdLength: 10
};

//production
environments.production={
    envName:"Production",
    httpPort:5000,
    httpsPort:5001,
    hashingSecret:"there is no server, that is the secret",
    minStrLen: 5,
    tokenExpTime: 2, //Hours
    tokenLength: 20,
    cartIdLength: 10
};

//Select env to export

const currentEnvironment =  typeof( process.env.NODE_ENV) == "string" ? process.env.NODE_ENV.toLowerCase() : "";

// Verify current env is defined or set the default

const environmentToExport = typeof( environments[currentEnvironment]) == "object" ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;