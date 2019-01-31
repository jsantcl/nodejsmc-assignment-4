//front end login for the application


// container for client application
let app = {};


//configuration in client
app.config = {
    sessionToken: false
}


//Ajax client for restful API
app.client = {};
app.client.request = ( headers, path, method, querystring, payload, callback) => {
    headers = typeof(headers)=="object" && headers!=null ? headers : {};
    path = typeof(path)=="string" && path.length > 0 ? path : "/";
    method = typeof(method) =="string" && ["POST", "GET", "PUT", "DELETE"].indexOf(method.toUpperCase())>-1 ? method.toUpperCase() : "GET";
    querystring = typeof(querystring)=="object" && querystring!==null ? querystring : {};
    callback = typeof(callback)=="function" ? callback : false;

    //for each querystring elements add it to the path
    let requestUrl = path + "?";
    let paramCount = 0;
    for( element in querystring) {
        if( querystring.hasOwnProperty(element)) {
            paramCount++;
            if( paramCount>1) {
                requestUrl += "&";
            }
            requestUrl += element + "=" + querystring[element];
        }
    }

    let xhr = new XMLHttpRequest();
    
    xhr.open( method, requestUrl, true);
    xhr.setRequestHeader("Content-Type","application/json");

    //add headers elements to request
    for(element in headers) {
        if( headers.hasOwnProperty(element)) {
            xhr.setRequestHeader( element, headers[element]);
        }
    }

    //add session token if any
    if(app.config.sessionToken) {
        xhr.setRequestHeader("token", app.config.sessionToken.id);
    }

    //handle the response
    xhr.onreadystatechange = () => {
        if( xhr.readyState == XMLHttpRequest.DONE) {
            let statusCode = xhr.status;
            let responseReturned = xhr.responseText;
            //if callback requested
            if( callback) {
                try {
                    let parsedResponse = JSON.parse( responseReturned);
                    callback( statusCode, parsedResponse);
                } catch ( err) {
                    callback(statusCode, false);
                }
            }
        }
    }

    //send the request
    let payloadString = JSON.stringify( payload);
    xhr.send( payloadString);
}

// Bind the forms
app.bindForms = function(){
  if(document.querySelector("form")){

    var allForms = document.querySelectorAll("form");
    for(var i = 0; i < allForms.length; i++){
        allForms[i].addEventListener("submit", function(e){

        // Stop it from submitting
        e.preventDefault();
        var formId = this.getAttribute("id");
        var path = this.action;
        var method = this.method.toUpperCase();

        document.querySelector("#"+formId+" .formError").style.display = 'none';

        // Hide the success message (if it's currently shown due to a previous error)
        if(document.querySelector("#"+formId+" .formSuccess")){
          document.querySelector("#"+formId+" .formSuccess").style.display = 'none';
        }


        // Turn the inputs into a payload
        var payload = {};
        payload.items = [];
        var elements = this.elements;
        for(var i = 0; i < elements.length; i++){
          if(elements[i].type !== 'submit'){
            // Determine class of element and set value accordingly
            var classOfElement = typeof(elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
            //var valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value);
            var valueOfElement = elements[i].type == 'text' && typeof(elements[i].value)=='number' ? parseInt(elements[i].value) : elements[i].value.length>0 ? elements[i].value : 0;
            //var elementIsChecked = elements[i].checked;
            // Override the method of the form if the input's name is _method
            var nameOfElement = elements[i].name;
            
            if(nameOfElement == '_method'){
              method = valueOfElement;
            } else {
              // Create an payload field named "method" if the elements name is actually httpmethod
              if(nameOfElement == 'httpmethod'){
                nameOfElement = 'method';
              }
              // Create an payload field named "id" if the elements name is actually uid
              if(nameOfElement == 'uid'){
                nameOfElement = 'id';
              }
              // If the element has the class "multiselect" add its value(s) as array elements
              /*if(classOfElement.indexOf('multiselect') > -1){
                if(elementIsChecked){
                  payload[nameOfElement] = typeof(payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                  payload[nameOfElement].push(valueOfElement);
                }
              }*/ 
              //My Hack to put together all items with quantity > 0 into an array and into the payload
              if( classOfElement.indexOf('quantity')>-1) {
                if(parseInt(valueOfElement)>0) {
                  payload.items.push({ 'id':nameOfElement, 'quantity':valueOfElement});
                }
              }
              else {
                payload[nameOfElement] = valueOfElement;
              }

            }
          }
        }


        // If the method is DELETE, the payload should be a queryStringObject instead
        var queryStringObject = method == 'DELETE' ? payload : {};

        // Call the API
        app.client.request(undefined,path,method,queryStringObject,payload,function(statusCode,responsePayload){
          // Display an error on the form if needed
          if( statusCode !== 201 && statusCode !== 200 ) {

            if(statusCode == 403){
              // log the user out
              app.logUserOut();

            } else {

              // Try to get the error from the api, or set a default error message
              var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

              // Set the formError field with the error text
              document.querySelector("#"+formId+" .formError").innerHTML = error;

              // Show (unhide) the form error field on the form
              document.querySelector("#"+formId+" .formError").style.display = 'block';
            }
          } else {
            // If successful, send to form response processor
            app.formResponseProcessor(formId,payload,responsePayload);
          }

        });
      });
    }
  }
};
 

// Bind the logout button
app.bindLogoutButton = () => {
    document.getElementById("logoutButton").addEventListener("click", (e) => {
  
      // Stop it from redirecting anywhere
      e.preventDefault();
  
      // Log the user out
      app.logUserOut();
  
    });
  };
  
  // Log the user out then redirect them
app.logUserOut = () => {
    // Get the current token id
    var tokenId = typeof(app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;
  
    // Send the current token to the tokens endpoint to delete it
    var queryStringObject = {
      'id' : tokenId
    };
    app.client.request(undefined,'api/tokens','DELETE',queryStringObject,undefined,(statusCode,responsePayload)=>{
      // Set the app.config token as false
      app.setSessionToken(false);
  
      // Send the user to the logged out page
      window.location = '/session/delete';
  
    });
};
  
// Form response processor
app.formResponseProcessor = (formId,requestPayload,responsePayload) => {
    var functionToCall = false;
    // If account creation was successful, try to immediately log the user in
    if(formId == 'accountCreate'){
      // Take the email and password, and use it to log the user in
      var newPayload = {
        'email' : requestPayload.email,
        'password' : requestPayload.password
      };
  
      app.client.request(undefined,'api/tokens','POST',undefined,newPayload,function(newStatusCode,newResponsePayload){
        // Display an error on the form if needed
        if(newStatusCode !== 200){
  
          // Set the formError field with the error text
          document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.';
  
          // Show (unhide) the form error field on the form
          document.querySelector("#"+formId+" .formError").style.display = 'block';
  
        } else {
          // If successful, set the token and redirect the user
          app.setSessionToken(newResponsePayload);
          window.location = '/menu/list';
        }
      });
    }
    // If login was successful, set the token in localstorage and redirect the user
    if(formId == 'sessionCreate'){
      app.setSessionToken(responsePayload);
      window.location = '/menu/list';
    }

     // If forms saved successfully and they have success messages, show them
  let formsWithSuccessMessages = ['accountEdit1', 'accountEdit2', 'cartCreate'];
  if(formsWithSuccessMessages.indexOf(formId) > -1){
    document.querySelector("#"+formId+" .formSuccess").style.display = 'block';
  }

    // If the user just deleted their account, redirect them to the account-delete page
    if(formId == 'accountEdit3'){
      app.logUserOut(false);
      window.location = '/account/delete';
    }

        // If the user just deleted their account, redirect them to the account-delete page
    if(formId == 'cartDelete'){
          window.location = '/cart/delete';
    }

    //move to order list on successfull purchase
    if(formId == 'purchase') {
      
      window.location = '/order/list';
    }
  
  };

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = (add) => {
    var target = document.querySelector("body");
    if(add){
      target.classList.add('loggedIn');
    } else {
      target.classList.remove('loggedIn');
    }
  };

  // Get the session token from localstorage and set it in the app.config object
app.getSessionToken = () => {
    var tokenString = localStorage.getItem('token');
    if(typeof(tokenString) == 'string'){
      try{
        var token = JSON.parse(tokenString);
        app.config.sessionToken = token;
        if(typeof(token) == 'object'){
          app.setLoggedInClass(true);
        } else {
          app.setLoggedInClass(false);
        }
      }catch(e){
        app.config.sessionToken = false;
        app.setLoggedInClass(false);
      }
    }
  };

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = (token) => {
    app.config.sessionToken = token;
    var tokenString = JSON.stringify(token);
    localStorage.setItem('token',tokenString);
    if(typeof(token) == 'object'){
      app.setLoggedInClass(true);
    } else {
      app.setLoggedInClass(false);
    }
  };

// Renew the token
app.renewToken = (callback) => {
    var currentToken = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
    if(currentToken){
      // Update the token with a new expiration
      var payload = {
        'id' : currentToken.id,
        'extend' : true,
      };
      app.client.request(undefined,'api/tokens','PUT',undefined,payload, (statusCode,responsePayload) =>{
        // Display an error on the form if needed
        if(statusCode == 200){
          // Get the new token details
          var queryStringObject = {'id' : currentToken.id};
          app.client.request(undefined,'api/tokens','GET',queryStringObject,undefined, (statusCode,responsePayload) => {
            // Display an error on the form if needed
            if(statusCode == 200){
              app.setSessionToken(responsePayload);
              callback(false);
            } else {
              app.setSessionToken(false);
              callback(true);
            }
          });
        } else {
          app.setSessionToken(false);
          callback(true);
        }
      });
    } else {
      app.setSessionToken(false);
      callback(true);
    }
  };

// Load data on the page
app.loadDataOnPage = () => {
    // Get the current page from the body class
    var bodyClasses = document.querySelector("body").classList;
    var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;
  
    // Logic for account settings page
    if(primaryClass == 'accountEdit'){
      app.loadAccountEditPage();
    }

    // Logic for dashboard page
  if(primaryClass == 'menuList'){
    app.loadMenuListPage();
  }

  //Logic for cartlist page
  if(primaryClass == 'cartList') {
    app.loadCartListPage();
  }

  //Logic for orders list page
  if(primaryClass == 'orderList') {
    app.loadOrderListPage();
  }

  };
  
  // Load the account edit page specifically
 app.loadAccountEditPage = () => {
    // Get the email from the current token, or log the user out if none is there
    var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
    if(email){
      // Fetch the user data
      var queryStringObject = {
        'email' : email
      };
      app.client.request(undefined,'api/users','GET',queryStringObject,undefined,(statusCode,responsePayload)=> {
        if(statusCode == 200){
          // Put the data into the forms as values where needed
          document.querySelector("#accountEdit1 .fullNameInput").value = responsePayload.name;
          document.querySelector("#accountEdit1 .streetAddressInput").value = responsePayload.streetaddress;
          document.querySelector("#accountEdit1 .displayEmailInput").value = responsePayload.email;
  
          // Put the hidden email field into both forms
          var hiddenEmailInputs = document.querySelectorAll("input.hiddenEmailInput");
          for(var i = 0; i < hiddenEmailInputs.length; i++){
              hiddenEmailInputs[i].value = responsePayload.email;
          }
  
        } else {
          // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
          app.logUserOut();
        }
      });
    } else {
      app.logUserOut();
    }
  
  
  
  };

// Loop to renew token often every 10 minutes
app.tokenRenewalLoop = () => {
    setInterval( () => {
      app.renewToken( (err)=> {
        if(!err){
          console.log("Token renewed successfully @ "+Date.now());
        }
      });
    },1000 * 60 * 10);
  };

// Load the Menu page
app.loadMenuListPage = () => {
  // Get the email from the current token, or log the user out if none is there
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the user data
    var queryStringObject = {
      'email' : email
    };
    app.client.request(undefined,'api/menu','GET',queryStringObject,undefined, (statusCode,responsePayload) => {
      if(statusCode == 200){

        // Determine how many items in the menu
        var allMenu = typeof(responsePayload) == 'object' && responsePayload instanceof Array && responsePayload.length > 0 ? responsePayload : [];

        // Put the hidden email field into both forms
        var hiddenEmailInputs = document.querySelectorAll("input.hiddenEmailInput");
        for(var i = 0; i < hiddenEmailInputs.length; i++){
            hiddenEmailInputs[i].value = queryStringObject['email'];
        }
        
        if(allMenu.length > 0){

          // Show each item on the menu, menu items are hardcoded
          allMenu.forEach( (item) => {
                
                var table = document.getElementById("menuListTable");
                var tr = table.insertRow(-1);
                tr.classList.add('checkRow');
                var td0 = tr.insertCell(0);
                var td1 = tr.insertCell(1);
                var td2 = tr.insertCell(2);
                var td3 = tr.insertCell(3);
                td0.innerHTML = item.id;
                td1.innerHTML = item.item;
                td2.innerHTML = item.value;
                td3.innerHTML = '<input class="quantity" type="text" name="' + item.id + '" placeholder="0" />';
          });

        } else {
           // Show the createCheck CTA
          document.getElementById("noElementMessage").style.display = 'block';

        }
      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }
};

//Load the cart list page
app.loadCartListPage = () => {
  // Get the email from the current token, or log the user out if none is there
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the user data
    var queryStringObject = {
      'email' : email
    };
    app.client.request(undefined,'api/users','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200){

        // Determine how many checks the user has
        var allCarts = typeof(responsePayload.carts) == 'object' && responsePayload.carts instanceof Array && responsePayload.carts.length > 0 ? responsePayload.carts : [];
        if(allCarts.length > 0){

          var total = 0;
          allCarts.forEach(function(id){
            //get the cart data
            var newQueryStringObject = {
              'id' : id
            };
            app.client.request(undefined,'api/cart','GET',newQueryStringObject,undefined,function(statusCode,responsePayload){
              if(statusCode == 200){
                
                var cartData = typeof(responsePayload.items) == 'object' && responsePayload.items instanceof Array && responsePayload.items.length > 0 ? responsePayload.items : [];
                var table = document.getElementById("cartListTable");
                cartData.forEach( (item)=>{
                  var tr = table.insertRow(-1);
                  tr.classList.add('cartRow');
                  var td0 = tr.insertCell(0);
                  var td1 = tr.insertCell(1);
                  var td2 = tr.insertCell(2);
                  var td3 = tr.insertCell(3);
                  td0.innerHTML = item.item;
                  td1.innerHTML = item.value;
                  td2.innerHTML = item.quantity;
                  total = total + parseInt(item.quantity)*parseFloat(item.value);
                  td3.innerHTML = (parseInt(item.quantity)*parseFloat(item.value)).toFixed(2);
                  //td4.innerHTML = '<a href="/cart/edit?id='+responsePayload.id+'">Edit</a>';
                  //td5.innerHTML = '<a href="/cart/delete?id='+responsePayload.id+'">Delete</a>';
                });
                //add the total
                var tr = table.insertRow(-1);
                  tr.classList.add('cartRow');
                  var td0 = tr.insertCell(0);
                  var td1 = tr.insertCell(1);
                  var td2 = tr.insertCell(2);
                  var td3 = tr.insertCell(3);
                  td0.innerHTML = '&nbsp;';
                  td1.innerHTML = '&nbsp;';
                  td2.innerHTML = 'Total Cart';
                  td3.innerHTML = total.toFixed(2);

                // Put the hidden email field and cart id
                var hiddenEmailInputs = document.querySelectorAll("input.hiddenEmailInput");
              for(var i = 0; i < hiddenEmailInputs.length; i++){
                  hiddenEmailInputs[i].value = responsePayload.email;
              }
              var hiddenCartIdInput=document.querySelectorAll("input.hiddenCartIdInput");
              for(var i = 0; i < hiddenCartIdInput.length; i++){
                hiddenCartIdInput[i].value = responsePayload.id;
            }

            //display delete button
            document.getElementById("existCart").style.display = 'block';
            //display place order
            document.getElementById("orderingCart").style.display = 'block';

              } else {
                console.log("Error trying to load cart ID: ",id);
              }
              
            });
          });
            
        } else {
          // Show 'you have no items in cart
          document.getElementById("noElementMessage").style.display = 'table-row';
          document.getElementById("createCart").style.display = 'block';
          

        }
      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }
};

//load Orders page
app.loadOrderListPage = () =>  {
// Get the email from the current token, or log the user out if none is there
var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
if(email){
  // Fetch the user data
  var queryStringObject = {
    'email' : email
  };
  app.client.request(undefined,'api/users','GET',queryStringObject,undefined,function(statusCode,responsePayload){
    if(statusCode == 200){

      // get all the users orders from the profile
      var allOrders = typeof(responsePayload.orders) == 'object' && responsePayload.orders instanceof Array && responsePayload.orders.length > 0 ? responsePayload.orders : [];
      if(allOrders.length > 0) {
        allOrders.forEach( (order)=>{
          console.log('===>', order);
          queryStringObject = {
            'id':order
          }

          //request order data on each loop pass
          app.client.request(undefined, 'api/order','GET',queryStringObject, undefined, (statusCode, orderPayload)=>{
            if(statusCode == 200) {
              var itemsInOrder = typeof(orderPayload.items) == 'object' && orderPayload.items instanceof Array && orderPayload.items.length > 0 ? orderPayload.items : [];
              var pizzasQuantity=0;
              itemsInOrder.forEach( (pizza)=>{
                pizzasQuantity = pizzasQuantity + parseInt(pizza.quantity);
              });
              var table = document.getElementById("orderListTable");
              var tr = table.insertRow(-1);
              tr.classList.add('cartRow');
              var td0 = tr.insertCell(0);
              var td1 = tr.insertCell(1);
              var td2 = tr.insertCell(2);
              var td3 = tr.insertCell(3);
              var td4 = tr.insertCell(4);
              var td5 = tr.insertCell(5);
              td0.innerHTML = orderPayload.id;
              td1.innerHTML = orderPayload.date;
              td2.innerHTML = orderPayload.value;
              td3.innerHTML = parseInt(pizzasQuantity);
              td4.innerHTML = orderPayload.paymentid;
              td5.innerHTML = orderPayload.paymentstatus ? 'Payment accepted' : 'Payment rejected';
                
            } else {
              console.log("Error trying to load order ID: ",order.id);
            }
          });
        });
      } else {
        document.getElementById("noElementMessage").style.display = 'table-row';
      }
    } else {
      app.logUserOut();
    }
  });
} else {
  app.logUserOut();
}
}
  // Init (bootstrapping)
  app.init = () => {
      // Bind all form submissions
  app.bindForms();

  // Bind logout logout button
  app.bindLogoutButton();

  // Get the token from localstorage
  app.getSessionToken();

  // Renew token
  app.tokenRenewalLoop();

  app.loadDataOnPage();
  };

  
  
  // Call the init processes after the DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
      app.init();
});