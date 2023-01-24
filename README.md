# Sample passport saml app with SLO with Auth0

This project uses passport-saml and auth0 to demonstrate SP Initiated SLO with Auth0 

## Requirements
- node.js
- express
- passport saml
- auth0 tenant with an application and a connection enabled

## Used middlewares
- passport
- express cookie
- express session
- morgan

## Auth0 Setup
  * Create an Auth0 tenant
  * Create an application of type Regular Web Application
  * Go to the addons tab
  * Click on the SAML2 WEB APP and then click on settings
  * Set the Application callback url - `BASEURL/login/callback` where BASEURL is the same as the BASE url of the app you set in the .env file below
  * Set the `settings` as
      ```
      {
          "mapUnknownClaimsAsIs": true,
          "passthroughClaimsWithNoMapping": true,
          "logout": {
              "callback": "BASEURL/singlelogout",
              "slo_enabled": true
          },
          "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
      }
      ```
   * Scroll to the bottom of this dialog and click "Save" and then close the dialog
   * Make sure your application has at least one connection enabled
     *   Click on the application's Connections tab and enable the connection you would like to use for this application

## ENV
 Before running the app, you should create your own `.env` file in the root with the following variables:
```dotenv
PORT=3001
ISSUER=saml-sp
BASEURL=<apps base url>
IDP_ENTRYPOINT=<SAML IDP url. You get this value from the Auth0 apps SAML Addon's Usage page>
IDP_SIGNING_CERT_STR="The IDP signing certificate with newlines removed and the -----BEGIN CERTIFICATE----- and -----END CERTIFICATE----- stripped out"
SESSIONSECRET=This is a great big secret for the session
```

## Running
    * Make sure you have set the .env file and completed the Auth0 Setup
  * npm install
  * npm start
  * open browser at `BASEURL` and click on login
  * Once logged in see the SAML Assettion and scroll to the bottom of the page and click logout to see the SLO flow
