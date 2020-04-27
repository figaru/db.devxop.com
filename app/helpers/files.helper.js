var fs = require('fs');
const Jimp = require('jimp');

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
    userId, 
    fileId,
    cb
    ) => {
    Jimp.read(data)
        .then(image => {
            //SAVE MAIN IMAGE 1080p
            image
                .scaleToFit(1920, 1080) // resize
                .quality(100) // set JPEG quality

            image.writeAsync('./storage/users/' + userId + '/' + fileId + '/main.jpeg').then(() => {
                //SAVE THUMB IMAGE 360p
                image
                    .scaleToFit(480, 270) // resize 1920p / 4 = 480px
                    .quality(70) // set JPEG quality

                image.writeAsync('./storage/users/' + userId + '/' + fileId + '/thumb.jpeg').then(() => {
                    //SAVE PRELOAD IMAGE 240p blurred
                    image
                        .scaleToFit(384, 216) // resize resize 1920p / 5 = 384px
                        .quality(50) // set JPEG quality
                        .blur(8)

                    image.writeAsync('./storage/users/' + userId + '/' + fileId + '/preload.jpeg').then(cb(null));
                });
            })

        })
        .catch(err => {
            // Handle an exception.
            //console.log(err);
            cb(err)
        });
}