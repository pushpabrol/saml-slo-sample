var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , SamlStrategy = require('passport-saml').Strategy
  , fs = require('fs')
  , morgan = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , session = require('express-session')
  , dotenv = require('dotenv');

dotenv.config();

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);

});


passport.use(new SamlStrategy(
  {
    callbackUrl: `${process.env.BASEURL}/login/callback`,
    // path: '/login/callback',
    // protocol: 'https://',
    issuer: process.env.ISSUER,
    //homeRealm: 'urn:auth0pse-addons', // specify an identity provider to avoid showing the idp selector
    entryPoint: process.env.IDP_ENTRYPOINT,
    // setup either a certificate base64 encoded (cer) or just the thumbprint of the certificate if public key is embedded in the signature
    cert: process.env.IDP_SIGNING_CERT_STR,
    passReqToCallback: true,
    // If the SP is signing SAML Requests used this 
    //signatureAlgorithm: 'sha256',
    //digestAlgorithm: 'sha256',
    //privateCert: fs.readFileSync('./key.pem', 'utf-8'),
    logoutUrl: `${process.env.IDP_ENTRYPOINT}/logout`,
    logoutCallbackUrl: `${process.env.BASEURL}/singlelogout`


  },
  function (req, profile, done) {
    //console.log(this._wsfed);
    // this._wsfed.retrieveToken(req, function(err, token) { 
    //   console.log(token);
    // });
    //console.log(req.body.SAMLResponse);
    //console.log("Auth with", profile);
    profile.email = profile.email || profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
    profile.name = profile.name || profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
    profile.SamlResponse = formatXml(Buffer.from(req.body.SAMLResponse, 'base64').toString());
    //console.log("Email", profile.email);
    //profile.userData = parseSamlResponse(req.body.SAMLResponse);
    //profile.xml = formatXml(req.body.SAMLResponse);
    return done(null, profile);

  }
));

var app = express();
var router = express.Router();

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(session({
  name: 'session-' + process.env.PORT,
  secret: process.env.SESSIONSECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('', router);
//app.use(express.static(__dirname + './public'));

app.use(express.static('./public'));



app.get('/', function (req, res) {
  res.render('index', { user: req.user });
});

app.get('/login',
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
  function (req, res) {
    res.redirect('/');
  }
);

app.post('/login/callback',
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
  function (req, res) {
    res.redirect('/');
  }
);

//
app.get('/logout', checkAuthentication, samlLogout);

app.get('/singlelogout', checkAuthentication, samlLogout);

app.get('/metadata',(req, res) => {
  const strategy = passport._strategy('saml');
    res.set('Cache-Control', 'no-store')
    res.type('application/xml');
    res.send((strategy.generateServiceProviderMetadata()));
  }
);


function samlLogout(req, res) {
  try {
    const strategy = passport._strategy('saml');
    strategy.logout(req, function (error, requestUrl) {
      if (error) console.log(`Can't generate log out url: ${err}`);
      req.logOut((error) => {
        if (error) console.log(error)
        else {
          //delete req.session.passport;
          console.log(requestUrl);
          res.redirect(requestUrl);
        }
      })
    });
  } catch (err) {
    if (err) console.log(`Exception on URL: ${err}`);
    req.logOut((error) => {
      if (error) console.log(error)
      else {
        delete req.session.passport;
        res.redirect('/');
      }
    })

  }
}



// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.

function checkAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/");
  }
}
/**
 * Not Used - IGNORE
 * If passport session exists sets the user on the req to that
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function sloCheck(req, res, next) {
  if (req.session.passport && req.session.passport.user) {
    req.user = req.session.passport.user;
    return next();
  } else {
    return res.redirect('/');
  }
}

function formatXml(xml) {
  var format = require('xml-formatter');

  var formattedXml = format(xml, {
    indentation: '  ',
    filter: (node) => node.type !== 'Comment',
    collapseContent: true,
    lineSeparator: '\n'
  });

  return formattedXml;
}

module.exports = app;
