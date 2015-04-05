var express = require('express');
var partials = require('express-partials');
var util = require('./lib/utility');
var mongoose = require('mongoose');
var handler = require('./lib/request-handler');

mongoose.connect(process.env.DB_Server || 'mongodb://localhost/shortlydb');
console.error('DB Server Secret is: ', process.env.DB_Server);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log('Mongodb connection is open!');
});

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser('glitterSPARKLES591438'));
  app.use(express.session());
});

app.get('/', util.checkUser, handler.renderIndex);
app.get('/create', util.checkUser, handler.renderIndex);

app.get('/links', util.checkUser, handler.fetchLinks);
app.post('/links', handler.saveLink);

app.get('/login', handler.loginUserForm);
app.post('/login', handler.loginUser);
app.get('/logout', handler.logoutUser);

app.get('/signup', handler.signupUserForm);
app.post('/signup', handler.signupUser);

app.get('/*', handler.findUrl, handler.navToLink);

module.exports = app;
