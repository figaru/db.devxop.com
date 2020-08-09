var fs = require('fs');
const Jimp = require('jimp');
const ThumbnailGenerator = require('video-thumbnail-generator').default;

const run = require('child_process').exec;

const Files = require('../models/files.model.js');

var removeFile = function (err) {
    if (err) {
        console.log("unlink failed", err);
    } else {
        console.log("file deleted");
    }
}

//fs.unlink('filepath', removeFile); // for single file


//for multiple files...

function deleteFiles(files, path, callback) {
    if (files.length == 0) callback();
    else {
        var f = files.pop();
        if (path) {
            f = path + f;
        } else {
            f = path + f;
        }

        fs.unlink(f, function (err) {
            if (err) callback(err);
            else {
                //console.log(f + ' deleted.');
                deleteFiles(files, path, callback);
            }
        });
    }
}

exports.createDirectory = function (path) {
    fs.mkdirSync(path);
}


exports.deleteFiles = function (files, path) {

    deleteFiles(files, path, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("finished deleteing files");
        }

    });
}

exports.saveImageFile = (
    data /* Buffer, URL, BASE64 */,
    dir,
    cb
) => {
    Jimp.read(data)
        .then(image => {
            //SAVE MAIN IMAGE 1080p
            let EXTENSION = ""
            image
                .scaleToFit(1920, 1080) // resize
                .quality(100) // set JPEG quality

            if(image._originalMime.includes("png")){
                EXTENSION = ".png";
            }else{
                EXTENSION = ".jpeg";
            }

            image.writeAsync(dir + 'main' + EXTENSION).then(() => {
                //SAVE THUMB IMAGE 360p
                image
                    .scaleToFit(480, 270) // resize 1920p / 4 = 480px
                    .quality(70) // set JPEG quality

                image.writeAsync(dir + 'thumb' + EXTENSION).then(() => {
                    //SAVE PRELOAD IMAGE 240p blurred
                    image
                        .scaleToFit(384, 216) // resize resize 1920p / 5 = 384px
                        .quality(50) // set JPEG quality
                        .blur(8)

                    image.writeAsync(dir + 'preload' + EXTENSION).then(cb(null));
                });
            })

        })
        .catch(err => {
            // Handle an exception.
            //console.log(err);
            cb(err)
        });
}


exports.getLocalDir = (file) => {
    if (file) {
        return "./storage/users/" + file.user_id + "/" + file._id + "/";
    }

    return null;
}

exports.getLocalDir = (fileId, userId) => {
    return "./storage/users/" + userId + "/" + fileId + "/";
}

exports.getLocalPath = (file) => {
    if (file) {
        return "./storage/users/" + file.user_id + "/" + file._id + "/video." + file.extension;
    }

    return null;

}

exports.getFileDownloadObject = (file) => {

    let data = {
        url: "",
        file_id: file._id,
        file_ext: ""
    }

    let type = file.file.mimetype.substring(0, 3);
    switch (type) {
        case "vid":
            data.url = "/files/" + file.user_id + "/" + file._id + "/video." + file.extension;
            data.file_ext = "." + file.extension; //eg. .mp4
            break;
        case "ima":
            data.url = "/files/" + file.user_id + "/" + file._id + "/main." + file.extension;
            data.file_ext = ".jpeg"; //eg. .mp4
            break;

        default:
            break;
    }


    return data;
}

exports.generatePreloadVideo = (filePath, fileDir)=>{
    const tg = new ThumbnailGenerator({
        sourcePath: filePath,
        thumbnailPath: fileDir
        // tmpDir: './storage/users/' + userId + '/' + id + '/tmp/' //only required if you can't write to /tmp/ and you need to generate gifs
    });

    tg.generate({
        size: "480x270"
    }).then((result) => {

        this.saveImageFile(fileDir + result[0], fileDir, function (err) {
            if (err) {
                console.log(err);
            }
            const ls = run('node ./app/processes/gif.process.js ' + fileDir + " " + result.join(" "),
                (error, stdout, stderr) => {
                    if (error !== null) {
                        console.log(`exec error: ${error}`);
                    }
                });

        });
    });

}