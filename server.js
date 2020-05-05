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

const WebSocket = require('ws');

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



const Users = require('./app/models/users.model.js');
const Devices = require('./app/models/devices.model.js');
const Files = require('./app/models/files.model.js');

const FileHelper = require("./app/helpers/files.helper");
const Random = require("./app/utils/random.utils");
const _checkPassword = require("./app/accounts/password");
//start app 
const port = process.env.PORT || 80;
const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', (client) => {
    console.log("Socket connection");
    console.log("Client Id: " + client.id);

    client.on("startup", () => { })
    client.on("update", (msg) => {
        
        //client.emit("test");
    });

    client.on("sync", (deviceId, authCode) => {

        /* let listVideos = [
            {
                url: "/files/bxxpwy2cwGNumjWTK/eeRvbqzPhxDsTPzow/video.mp4",
                file_id: "eeRvbqzPhxDsTPzow",
                file_ext: ".mp4"
            } 
            , {
                url: "/files/bxxpwy2cwGNumjWTK/5eFLJJfRN3eDCwhxZ/video.mp4",
                file_id: "5eFLJJfRN3eDCwhxZ",
                file_ext: ".mp4"
            },
        ]
        client.emit("video", JSON.stringify(listVideos)); */
        console.log("SYNC EVENT");
        if (deviceId && authCode) {
            Devices.findOne({ "device_id": deviceId, "authorization_code": authCode }).then(device => {
                if (device) {
                    //console.log(device);
                    let publishedView = device.published_view;
                    let views = device.views;
                    switch (publishedView) {
                        case "video":
                            // code block
                            if (typeof views.video.files != "undefined") {
                                let files = views.video.files;
                                //console.log(files);
                                Files.find({
                                    '_id': {
                                        $in: files
                                    }
                                }).then(filesList => {
                                    console.log("Files list count: " + filesList.length);
                                    let data = [];

                                    filesList.forEach(element => {
                                        data.push(FileHelper.getFileDownloadObject(element));
                                    });

                                    
                                    client.emit("video", JSON.stringify(data));
                                });

                                //client.emit("video", )
                            }
                            break;
                        case "image":
                            // code block
                            client.emit("image");
                            break;
                        default:
                            // code block
                            client.emit("unknown");
                    }
                }else{
                    client.emit("dispose");
                }

            })
        }
    });

    client.on("login", async (params) => {
        params = JSON.parse(params);

        //first validate login
        Users.findOne({ "emails.$.address": { $in: [params.username] } }).then((user) => {
            if (user) {
                _checkPassword(user, params.pass).then((result) => {
                    if (result.valid) {
                        Devices.findOne({ "device_id": params.device_id }).then(device => {
                            if (device) {
                                //exists _> update auth data
                                let authCode = Random.secret();
                                Devices.updateOne({ "_id": device._id }, {
                                    $set: {
                                        "authorization_code": authCode
                                    }
                                }).then(() => {
                                    client.emit("login.success", authCode);
                                }).catch(() => {
                                    //here return the old authCode
                                    client.emit("login.success", device.authorization_code);
                                });

                            } else {
                                //dosent exist _> create one

                                let obj = {
                                    _id: Random.id(),
                                    user_id: user._id,
                                    device_id: params.device_id,
                                    authorization_code: Random.secret(),
                                    create_stamp: new Date().getTime(),
                                    update_stamp: new Date().getTime(),
                                    published_view: "",
                                    views: {},
                                    /* auth: {
                                        access_token: Random.secret(),
                                        refresh_token: Random.secret(),
                                        auth_stamp: new Date().getTime(),
                                    } */
                                }

                                const deviceObj = new Devices(obj);

                                deviceObj.save().then(res => {
                                    //res == device
                                    client.emit("login.success", res.authorization_code);
                                }).catch(e => {
                                    console.log(e);
                                    client.emit("login.failed", "Failed to create device.");
                                });

                            }
                        });

                        /* client.emit("login.success"); */
                    } else {
                        client.emit("login.failed");
                    }
                });


            }
        }).catch((e) => {
            console.log(e);
            client.emit("login.failed");
        });



        //if success -> emit login.success
        //client.emit("login.success");


        //else error -> emit login.failed

    });

    client.on('disconnect', () => {
        console.log("Socket client disconnected");
    });
});
server.listen(port, () => {
    console.log(_storage.getFileDir("userId", "fileId"));
    console.log(`App is listening on port ${port}.`)
});

/* app.listen(port, () => {
    console.log(_storage.getFileDir("userId", "fileId"));
    console.log(`App is listening on port ${port}.`)
}); */


