// analyticsvar 
newrelic = require('newrelic');
// bootstrap
require('./bootstrap.js');
// expressvar 
express = require('express');
// require middlewaresvar 
http = require('http');
var favicon = require('serve-favicon');
var parser = require('body-parser');
var cookie = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var override = require('method-override');
var passportSocketIo = require('passport.socketio');
var MongoStore = require('connect-mongo')(session);
var AirbrakeClient = require('airbrake-js');
var makeErrorHandler = require('airbrake-js/dist/instrumentation/express');
global.app = express();
// set app settings
app.set('trust proxy', 'loopback');
app.set('views', APP_PATH + 'views');
app.set('view engine', 'pug'); console.log(APP_PATH);
// set app middlewares
app.use(function (req, res, next) {
  app.ipInfo = req.headers['x-real-ip'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress; 
  next(); });
  app.use(favicon(__dirname + '/public/img/favicon-32x32.png'));
  app.use(express.static(APP_PATH + 'public')); app.use(override()); 
  app.use(cookie()); app.use(parser.json({ limit: '100mb', extended: true })); 
  app.use(parser.urlencoded({ limit: '100mb', extended: true })); 
  app.use(Middlewares.general.locals); 
  var sessionStore = new MongoStore({ mongooseConnection: require('mongoose').connection });
// Add timestamps for unhandled exceptions
process.on('uncaughtException', function (e) {  console.log(moment().format(), e.stack || e);  
process.exit(1);});app.use(session({  secret: config.get('cookie_secret'),
store: sessionStore, 
resave: true, 
saveUninitialized: true, 
auto_reconnect: true})); 
if (app.get('env') === 'development') { 
  app.use(morgan('dev')); app.locals.pretty = true; 
}
// setup helpers
Helpers.analytics();
Helpers.stripe.sync_plans();
// load controllers
require(APP_PATH + '/controllers');
// Redirect all frontend routes to the main AngularJS bootstrap file to support HTML5 mode.
// This should be put after loading controllers, because we don't want to intercept '/api' 
routes.app.use('/*', function(req, res) {  res.render('index.pug');});
var airbrake = new AirbrakeClient({  projectId: '....',  projectKey: '....'}); 
app.use(makeErrorHandler(airbrake)); var server = http.createServer(app);
// start server
server.listen(config.get('port'), function() {  
  console.log('rolling on port ' + config.get('port'));
});
// socket.io
global.io = require('socket.io')(server, {  transports: ['websocket', 'polling', 'xhr-polling']});
// allow socket connections to talk to each other across processes  in a cluster
const redis = require('socket.io-redis');io.adapter(redis({ host: config.get('redis_host'), port: 6379}));
io.use(passportSocketIo.authorize({  secret: config.get('cookie_secret'),  store: sessionStore,}));
io.on('connection', Helpers.socket.onConnection);