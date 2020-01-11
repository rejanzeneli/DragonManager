const express = require('express');
const session = require('cookie-session');
const cookieParser = require('cookie-parser');
let compression = require('compression');
const path = require('path');
const favicon = require('serve-favicon');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const flash = require('connect-flash');

dotenv.config();

// Load routes
const indexRouter = require('./routes/index');
indexRouter.init();
const restRouter = require('./routes/rest_api');
restRouter.init();
const atlasRouter = require('./routes/atlas_api');
atlasRouter.init();

const app = express();
app.set('trust proxy', 1); // trust first proxy

app.use(cors());
app.use(compression());

const defaultPort = 8888;
const port = process.env.NODE_PORT || defaultPort;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (app.get('env') === 'development') {
  const logger = require('morgan');
  app.use(logger('dev'));
}
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// config cookie-session
let sess = {
  name: 'session',
  keys: ['9mb:cm%6:^:@F<u+'],
};

app.use(session(sess));

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

app.use(flash());

// Handle auth failure error messages
app.use(function (req, res, next) {
  if (req && req.query && req.query.error) {
    req.flash('error', req.query.error);
  }
  if (req && req.query && req.query.error_description) {
    req.flash('error_description', req.query.error_description);
  }
  next();
});

app.use('/', indexRouter.router);
app.use('/api/v1/atlas/', atlasRouter.router);
app.use('/api/v1/', restRouter.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// Global basedir
global.__basedir = __dirname;

// Initialize modules
require('./controllers/tiers').init(publicPath);
require('./controllers/scaling').init();
require('./controllers/texts').init();
require('./controllers/achievements').init();
require('./controllers/spells').init();
require('./controllers/currencies').init();
require('./controllers/playerlevels').init();
require('./controllers/flavors').init();
require('./controllers/building').init();
require('./controllers/dragonClasses').init();
require('./controllers/dragons').init();
require('./controllers/breeding').init();
require('./controllers/researcheggs').init();
require('./controllers/runes').init();
require('./controllers/riders').init();
require('./controllers/atlas_controller').init();

app.listen(port);
console.log(`Listening on localhost:${port}`);

module.exports = app;
