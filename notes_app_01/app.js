// Module dependencies.
var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , method_override = require('method-override')
  , path = require('path');
var fileUpload = require('express-fileupload');
var session = require('express-session');
var app = express();
var mysql      = require('mysql');
var bodyParser=require("body-parser");
var connection = mysql.createConnection({
              host     : 'localhost',
              user     : 'root',
              password : 'cwetyy09',
              database : 'notes',
              dateStrings: 'date',
              timezone: 'GTM+1'
            });
 
connection.connect();
 
global.db = connection;
module.exports = connection;
 
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(method_override('_method'));
app.use(fileUpload());

app.use(session({
              secret: 'keyboard cat',
              resave: false,
              saveUninitialized: true,
              cookie: { maxAge: 900000 }
              // cookie: { secure: true }
            }))


// development only
app.get('/', routes.index);//call for main index page
app.get('/signup', user.signup);//call for signup page
app.post('/signup', user.signup);//call for signup post 
app.get('/login', routes.index);//call for login page
app.post('/login', user.login);//call for login post
app.get('/home/dashboard', user.dashboard);//call for dashboard page after login
app.get('/home/logout', user.logout);//call for logout
app.get('/home/profile',user.profile);//to render users profile
app.delete('/home/profile/delete',user.profile);//to delete user notes
app.get('/home/profile/note/:noteId',user.note);//to render single note
app.put('/home/profile/note',user.note); //to edit note
app.delete('/home/profile/note',user.note); //to detele note
app.post('/home/profile/note',user.createNote); //to remder created note
app.get('/home/profile/note',user.createNote); //to create note
app.post('/home/profile/sharenote',user.shareNote); //to share note with a user


//Middleware
// app.listen(3000)
app.listen('3000' , () => {
  console.log('Server started on port 3000');
});
