# nodejsmc-assignment-2
Nodejs Master Class Assignment #2

The Assignment (Scenario):

You are building the API for a pizza-delivery company. Don't worry about a frontend, just build the API. Here's the spec from your project manager: 

1. New users can be created, their information can be edited, and they can be deleted. We should store their name, email address, and street address.

2. Users can log in and log out by creating or destroying a token.

3. When a user is logged in, they should be able to GET all the possible menu items (these items can be hardcoded into the system). 

4. A logged-in user should be able to fill a shopping cart with menu items

5. A logged-in user should be able to create an order. You should integrate with the Sandbox of Stripe.com to accept their payment. Note: Use the stripe sandbox for your testing. Follow this link and click on the "tokens" tab to see the fake tokens you can use server-side to confirm the integration is working: https://stripe.com/docs/testing#cards

6. When an order is placed, you should email the user a receipt. You should integrate with the sandbox of Mailgun.com for this. Note: Every Mailgun account comes with a sandbox email account domain (whatever@sandbox123.mailgun.org) that you can send from by default. So, there's no need to setup any DNS for your domain for this task https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account


API Documentation
-------------
* User Creation
Method: POST
Endpoint: /users/
Required Payload Data:
    name            string
    email           string
    password        string
    streetaddress   string

* User Query Data
Method: GET
Endpoint: /users/?{email=<email>}
Required Query String Data:
    email           string
Required Header Data:
    token           string

* User Update Data
Method: PUT
Endpoint: /users/
Required Payload Data:
    email           string
Optional Payload Data:
    name            string
    streetaddress   string
Required Header Data:
    token           string

* User Deletion
Method: DELETE
Endpoint: /users/
Required Payload Data:
    email           string
Required Header Data:
    token           string

* User Login
Method: POST
Endpoint: /login/
Required Payload Data:
    email           string
    password        string

*User Logout
Method: DELETE
Endpoint: /logout/
Required Header Data:
    token           string

* Token Creation
Method: POST
Endpoint: /tokens/
Required Payload Data:
    email           string
    password        string

* Token Query Data
Method: GET
Endpoint: /token/?{id=<token>}
Required Query String Data:
    id           string

* Token Update Data
Method: PUT
Endpoint: /token/
Required Payload Data:
    id          string
    extend      boolean

* Token Deletion
Method: DELETE
Endpoint: /token/?{id=<token>}
Required Query String Data:
    id           string

* Shopping Cart Creation
Method: POST
Endpoint: /cart/
Required Payload Data:
    email        string
    items        object
                    id          number
                    quantity    number
Required Header Data:
    token           string

* Shopping Cart Query
Method: GET
Endpoint: /cart/?{id=<cart id>}
Required Query String Data:
    id           string
Required Header Data:
    token           string

* Shopping Cart Update
Method: PUT
Endpoint: /cart/
Required Payload Data:
    items        object
                 id          number
                 quantity    number
Required Header Data:
    token           string

* Shopping Cart Delete
Method: DELETE
Endpoint: /cart/?{id=<cart id>}
Required Query String Data:
    id          string
Required Header Data:
    token           string
