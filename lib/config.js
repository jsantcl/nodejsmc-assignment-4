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
    cartIdLength: 10,
    creditCardLength: 10,
    orderIdLength: 12,
    paymentAPI: {
        protocol: "https:",
        hostname: "api.stripe.com",
        method: "POST",
        path: "/v1/charges",
        auth: process.env.PAY_API_KEY,
        currency: "usd"
    },
    emailAPI : {
        protocal: "https:",
        hostname: "api.mailgun.net",
        method: "POST",
        path: "/v3/sandbox6e6ee770314c42dd9ddf0e23f809b0d7.mailgun.org/messages",
        auth: process.env.MAIL_API_KEY
    }
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
    cartIdLength: 10,
    creditCardLength: 10,
    orderIdLength: 12,
    paymentAPI: {
        protocol: "https:",
        hostname: "api.stripe.com",
        method: "POST",
        path: "/v1/charges",
        auth: process.env.API_KEY,
        currency: "usd"
    }
};

//Select env to export

const currentEnvironment =  typeof( process.env.NODE_ENV) == "string" ? process.env.NODE_ENV.toLowerCase() : "";

// Verify current env is defined or set the default

const environmentToExport = typeof( environments[currentEnvironment]) == "object" ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;