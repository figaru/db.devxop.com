const Users = require('./app/models/users.model.js');
const Devices = require('./app/models/devices.model.js');
const Files = require('./app/models/files.model.js');

const FileHelper = require("./app/helpers/files.helper");
const Random = require("./app/utils/random.utils");
const _checkPassword = require("./app/accounts/password");


module.exports = (server) => {
    const io = require('socket.io')(server);

    console.log(io);
    io.on('connection', (client) => {

        //process.stdout.write("Socket Clients: " + io.engine.clientsCount + " \r");
        console.log("Socket connection");
        console.log("Client Id: " + client.id);
        client.on('disconnect', () => {
            //process.stdout.write("Socket Clients: " + io.engine.clientsCount + " \r");
            //console.log("Socket client disconnected");
            //console.log(client.id);
            Devices.updateOne({ "socket_id": client.id }, {
                $set: {
                    "socket_id": ""
                }
            }).then(() => {
                //console.log("Socket_id removed from user.")
            });

        });


        /* CLIENT to DEVICE RELATED EMITORS */
        client.on("device.emit.update", (deviceId) => {
            /* 
                Device.update -> event called from client app
                Param -> device._id
                Function -> Emit update event to clients display device.
                    client receives event and requests a sync event so that server
                    can emit the correct events
            */
            console.log("emitting update");
            Devices.findOne({ "_id": "" + deviceId }).then(device => {
                if (device) {
                    var client = io.sockets.sockets[device.socket_id];
                    if (client) {
                        client.emit("update", ""+device.v_id);
                    }
                }
            });
        });

        client.on("device.emit.restart", (deviceId) => {
            /* 
                Device.update -> event called from client app
                Param -> device._id
                Function -> Emit update event to clients display device.
                    client receives event and requests a sync event so that server
                    can emit the correct events
            */
            Devices.findOne({ "_id": "" + deviceId }).then(device => {
                if (device) {
                    var client = io.sockets.sockets[device.socket_id];
                    if (client) {
                        client.emit("restart");
                    }
                }
            });
        });




        /* DEVICE REALATED REQUESTS */
        client.on("device.request.ping", (deviceId, vId) => {
            //vId == device document v_id;

            if (!deviceId)
                return;

            Devices.findOneAndUpdate(
                { "device_id": deviceId },
                {
                    $set: {
                        "ping_stamp": new Date().getTime()
                    }
                }).then((device)=>{
                    //console.log(device);
                    if(vId != device.v_id){
                        console.log(device.v_id);
                        client.emit("update", ""+device.v_id);
                    }
                });

        });

        client.on("device.request.startup", (deviceId, appVersion) => {
            /* 
                Device.startup -> event called from client device
                Param -> device_id
                Function -> Client device emiting a startup event so that the server 
                can store some iportant informarion. startup_stamp and the devices current socket_id
            */
            if (!deviceId)
                return;

            //lets update the device with socket connection id
            Devices.updateOne({ "device_id": deviceId }, {
                $set: {
                    "socket_id": client.id,
                    "startup_stamp": new Date().getTime(),
                    "app_version": appVersion
                }
            }).then(() => {
                //console.log("Updated socket connection");
            });

        });



        client.on("device.request.sync", (deviceId, authCode) => {
            /* 
                Device.sync -> event called from client device
                Param -> device._id + authentication_code
                Function -> Client device requesting a sync wich server will respond
                    voiew current selected view that user has chosen. Socket_id will be stored
                    in devices mongo document to later be used to emit messages from user client.
            */
            if (deviceId && authCode) {
                Devices.findOne({ "device_id": deviceId, "authorization_code": authCode }).then(device => {
                    if (device) {
                        //lets update the device with socket connection id
                        Devices.updateOne({ "_id": device._id }, {
                            $set: {
                                "update_stamp": new Date().getTime
                            }
                        }).then(() => {
                            //console.log("Updated socket connection");
                        });

                        //console.log(device);
                        let publishedView = device.published_view;
                        let views = device.views;
                        switch (publishedView) {
                            case "video":
                                // code block
                                if (typeof views.video.files != "undefined") {
                                    let fileId = views.video.files[0];
                                    //console.log(files);
                                    Files.findOne({
                                        '_id': fileId
                                    }).then(file => {
                                        let fileDownloadObject = FileHelper.getFileDownloadObject(file)

                                        

                                        client.emit("video", JSON.stringify(fileDownloadObject));
                                    });

                                    //client.emit("video", )
                                }
                                break;
                            case "image":
                                // code block
                                if (typeof views.image.files != "undefined") {
                                    let files = views.image.files;
                                    //console.log(files);
                                    Files.find({
                                        '_id': {
                                            $in: files
                                        }
                                    }).then(filesList => {
                                        /* console.log("Files list count: " + filesList.length); */
                                        let data = [];

                                        filesList.forEach(element => {
                                            data.push(FileHelper.getFileDownloadObject(element));
                                        });


                                        client.emit("image", JSON.stringify(data), views.image.interval);
                                    });

                                    //client.emit("video", )
                                }
                                break;
                            default:
                                // code block
                                client.emit("unknown");
                        }
                    } else {
                        client.emit("dispose");
                    }

                })
            }
        });

        client.on("device.request.login", async (params) => {
            params = JSON.parse(params);
            //first validate login
            Users.findOne({ "emails.address": params.user }).then((user) => {
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

    });
}

