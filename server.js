/* Global Variables */
_globals = require('./globals.js');
_storage = require('./app/helpers/storage.helper');

const express = require('express');
const MongoHelper = require('./app/helpers/mongo.helper'); 
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const mime = require('mime-types');
const compressing = require('compressing');

const { randomId } = require('@tozd/random-id');

const middleware = require('./middleware.js');

require('dotenv').config({ path: './.env' })

// create express app
const app = express();


// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

//virtual static folder -> access publicly
app.use('/files', express.static('storage/users'));
app.use(middleware.MongoValidation);

// Require Notes routes
require('./app/routes/files.routes.js')(app);
app.use(middleware.SchemaError);


// Configuring the database
const dbConfig = require('./config/db.config.js');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.Promise = global.Promise;

// get an environment variable for mongodb
dbConfig.url = process.env['DATABASE_URL'];



// Connecting to the database
mongoose.connect(dbConfig.url, dbConfig.options).then(() => {
    MongoHelper.MONGO_CONNECTED();
    mongoose.connection.on('disconnected', MongoHelper.MONGO_ERROR);

    mongoose.connection.on('connected', MongoHelper.MONGO_CONNECTED);

    mongoose.connection.on('error', MongoHelper.MONGO_ERROR);

}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

/* var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 40510 });

wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        console.log('received: %s', message)
    })

    setInterval(
        () => ws.send(`${new Date()}`),
        1000
    )
}); */

//start app 
const port = process.env.PORT || 80;
app.listen(port, () =>{
    console.log(_storage.getFileDir("userId", "fileId"));
    console.log(`App is listening on port ${port}.`)
});


