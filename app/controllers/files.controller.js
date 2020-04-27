const File = require('../models/files.model.js');
const Users = require('../models/users.model.js');
const ThumbnailGenerator = require('video-thumbnail-generator').default;
const { randomId } = require('@tozd/random-id');
const mime = require('mime-types');
const fs = require('fs');
const exec = require('child_process').exec;

const FileHelper = require("../helpers/files.helper");

const GifGenerator = require("./gif-generator");


const Jimp = require('jimp');

// Create and Save a new file
exports.create = async (req, res) => {

    //console.log(req.data);

    (async () => {
        const id = await randomId();

        //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
        let file = req.data.file;
        let userId = req.data.user_id;

        if (!userId) {
            return res.status(401).send({
                message: "You are not authorized to make this connection."
            });
        } else {
            const exists = await Users.find({ _id: userId });
            if (!exists) {
                return res.status(401).send({
                    message: "You are not authorized to make this connection."
                });
            } else {
                console.log("user has been validated. continue...")
            }
        }

        //let extraFields = req.data.extra_fields;
        let fileExtension = mime.extension(file.mimetype);
        let isImage = file.mimetype.startsWith("image");
        let isVideo = file.mimetype.startsWith("video");

        // Create a FileObj
        let obj = req.data;
        delete obj.file.type;

        obj["_id"] = id;
        obj["is_video"] = isVideo;
        obj["is_image"] = isImage;
        obj["extension"] = fileExtension;
        obj["title"] = file.name;
        const fileObj = new File(obj);

        if (isImage) {
            FileHelper.saveImageFile(file.data, userId, id, function (err) {
                if (err) {
                    //console.log(err);
                    return res.status(500).send({
                        message: err.message || "Some error occurred while creating the File."
                    });
                }

                //only delete data later
                delete fileObj.file.data;

                // Save File in the database
                fileObj.save()
                    .then(data => {
                        return res.send(data);
                    }).catch(err => {
                        return res.status(500).send({
                            message: err.message || "Some error occurred while creating the File."
                        });
                    });
            });

        } else if (isVideo) {
            file.mv('./storage/users/' + userId + '/' + id + '/video.' + fileExtension, () => {
                console.log("saved file!");
                const tg = new ThumbnailGenerator({
                    sourcePath: './storage/users/' + userId + '/' + id + '/video.' + fileExtension,
                    thumbnailPath: './storage/users/' + userId + '/' + id + '/'
                    // tmpDir: './storage/users/' + userId + '/' + id + '/tmp/' //only required if you can't write to /tmp/ and you need to generate gifs
                });

                tg.generate({
                    size: "480x270"
                }).then((result) => {
                    const path = './storage/users/' + userId + '/' + id + '/';

                    FileHelper.saveImageFile(path + result[0], userId, id, function (err) {
                        if (err) {
                            console.log(err);
                            return res.status(500).send({
                                message: err.message || "Some error occurred while creating the File."
                            });
                        }
                        const child = exec('node ./app/processes/gif.process.js ' + path + " " + result.join(" "),
                            (error, stdout, stderr) => {
                                //console.log(`stdout: ${stdout}`);
                                //console.log(`stderr: ${stderr}`);
                                if (error !== null) {
                                    console.log(`exec error: ${error}`);
                                }
                            });

                        //only delete data later
                        delete fileObj.file.data;
                        // Save File in the database
                        fileObj.save()
                            .then(data => {
                                return res.send(data);
                            }).catch(err => {
                                console.log(err);
                                return res.status(500).send({
                                    message: err.message || "Some error occurred while creating the File."
                                });
                            });
                    });



                }).catch((err) => {
                    console.log("TG IMAGE FROM VIDEO")
                    console.log(err);
                    return res.status(500).send({
                        message: err.message || "Some error occurred while creating the File."
                    });
                })
            });

        } else {
            file.mv('./storage/users/' + userId + '/' + id + '/' + file.name, () => {
                //only delete data later
                delete fileObj.file.data;
                // Save File in the database
                fileObj.save()
                    .then(data => {
                        return res.send(data);
                    }).catch(err => {
                        console.log(err);
                        return res.status(500).send({
                            message: err.message || "Some error occurred while creating the File."
                        });
                    });
            });
        }

    })().catch((error) => {
        console.log(error);
        return res.status(500).send({
            message: error.message || "Some error occurred while creating the File."
        });
    });

};

// Retrieve and return all files from the database.
exports.findAll = (req, res) => {

};

// Find a single file with a fileId
exports.findOne = (req, res) => {

};

// Update a file identified by the fileId in the request
exports.update = (req, res) => {

};

// Delete a file with the specified fileId in the request
exports.delete = (req, res) => {

    let fileId = req.data.file_id;
    let userId = req.data.user_id;
    let dir = './storage/users/' + userId + '/' + fileId;

    fs.rmdir(dir, { recursive: true }, () => {
        File.findByIdAndRemove(fileId)
            .then(file => {
                if (!file) {
                    return res.status(404).send({
                        message: "file not found with id " + fileId
                    });
                }
                res.send({ message: "file deleted successfully!" });
            }).catch(err => {
                if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                    return res.status(404).send({
                        message: "file not found with id " + fileId
                    });
                }
                return res.status(500).send({
                    message: "Could not delete file with id " + fileId
                });
            });
    });

    /* fs.unlink('./storage/users/' + userId + '/' + fileId, function (err) {
        if (err && err.code == 'ENOENT') {
            return res.status(404).send({
                message: "file not found with id " + fileId
            });
        } else if (err) {
            return res.status(500).send({
                message: "Could not delete file with id " + fileId
            });
        } else {
            
        }
    }); */
};