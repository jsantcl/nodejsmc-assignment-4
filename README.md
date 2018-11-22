# nodejsmc-assignment-2
##Nodejs Master Class Assignment #2

#API Documentation
#-----------------

###**User Creation**
###**-------------**
-Method: POST
-Endpoint: /users/
-Required Payload Data:
--name            string
--email           string
--password        string
--streetaddress   string
-Returned data:
--code        201 ( Object created)
--code        400 ( Error)
--code        500 ( Internal error)

###**Query User Data**
###**---------------**
-Method: GET
-Endpoint: /users/?{email=<email>}
-Required Query String Data:
--email           string
-Required Header Data:
--token           string
-Returned data:
--code        200 ( Object found) - user data: {name, email, stretaddress, carts:[], orders[]}
--code        400 ( Object not found)
--code        500 ( Internal error)

###**User Update Data**
###**----------------**
-Method: PUT
-Endpoint: /users/
-Required Payload Data:
--email           string
-Optional Payload Data:
--name            string
--streetaddress   string
-Required Header Data:
--token           string
-Returned data:
--code      201 ( Object updated)
--code      400 ( Not found)
--code        500 ( Internal error)

###**User Deletion**
###**-------------**
-Method: DELETE
-Endpoint: /users/
-Required Payload Data:
--email           string
-Required Header Data:
--token           string
-Returned data:
--code      200 ( Object deleted)
--code      500 ( Internal error)
--code      400 (Not found)

###**User Login**
###**----------**
-Method: POST
-Endpoint: /login/
-Required Payload Data:
--email           string
--password        string
-Returned data:
--code      200 ( Object found) - token data: { emal, tokenid, expires}
--code      400 ( Not found)
--code      500 ( Internal error)

###**User Logout**
###**-----------**
-Method: DELETE
-Endpoint: /logout/
-Required Header Data:
--token           string
-Returned data:
--code     200 ( Object found)
--code     500 (Internal error)
--code     400 ( Not found) 

###**Token Creation**
###**--------------**
-Method: POST
-Endpoint: /tokens/
-Required Payload Data:
--email           string
--password        string
-Returned data:
--code      200 ( Object found) - token data: { emal, tokenid, expires}
--code      500 (Internal error)
--code      400 (not found)

###**Token Query Data**
###**----------------**
-Method: GET
-Endpoint: /token/?{id=<token>}
-Required Query String Data:
--id           string
-Returned data:
--code      200 ( Object found) - token data: { emal, tokenid, expires}

###**Token Update Data**
###**-----------------**
-Method: PUT
-Endpoint: /token/
-Required Payload Data:
--id          string
--extend      boolean
-Returned data:
--code      200 (Object updated)
--code      400 ( not found)

###**Token Deletion**
###**--------------**
-Method: DELETE
-Endpoint: /token/?{id=<token>}
-Required Query String Data:
--id           string
-Returned data:
--code      200 (Object deleted)
--code      400 (not found)
--code      500 (internal error)

###**Menu List**
###**---------**
-Method: GET
-Endpoint: /menu/
-Required Header Data:
--token           string
-Returned data:
--code      200 (Object found) - menu data: {id, item, value}
--code      400 (not found)
--code      500 (internal error)

###**Shopping Cart Creation**
###**----------------------**
-Method: POST
-Endpoint: /cart/
-Required Payload Data:
--email        string
--items        object {id: number, quantity: number}
-Required Header Data:
--token           string
-Returned data:
--code      200 (Object created)
--code      500 (Internal error)
--code      400 (not found)

###**Shopping Cart Query**
###**-------------------**
-Method: GET
-Endpoint: /cart/?{id=<cart id>}
-Required Query String Data:
--id           string
-Required Header Data:
--token           string
-Returned data:
--code      200 (Object found) - cart data: { id, email, items:[{id, quantuty}]}
--code      500 (Internal error)
--code      400 (not found)

###**Shopping Cart Update**
###**--------------------**
-Method: PUT
-Endpoint: /cart/
-Required Payload Data:
--items        {id, number, quantity}
-Required Header Data:
--token           string
-Returned data:
--code      200 ( Object updated)
--code      500 (Internal error)
--code      400 (not found)

###**Shopping Cart Deletion**
###**----------------------**
-Method: DELETE
-Endpoint: /cart/?{id=<cart id>}
-Required Query String Data:
--id          string
-Required Header Data:
--token           string
-Returned data:
--code      200 (Object deleted)
--code      400 (not found)
--code      500 (internal error)


###**Order Creation**
###**----------------**
-Method: POST
-Endpoint: /order/
-Required Payload Data:
--cartid            string
--creditcard        number
--expiration year   number
--expiration month  number
-Required Header Data:
--token           string
-Returned data:
--code      200 (Object created) order data: {id, email, value, paymentstatus, item:[{id, quantity}], date, emailsent, paymentid}
--code      500 (Internal error)
--code      400 (not found)


###**Order Query**
###**-----------**
-Method: GET
-Endpoint: /order/?{id=<cartid>}
-Required Query String Data:
--cartid            string
-Required Header Data:
--token           string
-Returned data:
--code      200 (Object found) order data: {id, email, value, paymentstatus, item:[{id, quantity}], date, emailsent, paymentid}
--code      400 (not found)


###**Worker Process**
###**--------------**
Worker process will send every 5 minutes an email for every order with payment status "true" and emailsent is false, also will update the "emailsent" field to true on successfull sent.