var getPixels = require('get-pixels')
var GifEncoder = require('gif-encoder');
var gif = new GifEncoder(480, 270);
var file;
let gifFile;
var pics = ['./pics/1.jpg', './pics/2.jpg', './pics/3.jpg'];

const FilesHelper = require('../helpers/files.helper');

var addToGif = function (images, path, counter = 0) {

    let img = images[counter];
    if (img) {
        getPixels(path + images[counter], function (err, pixels) {
            if (err) {
                console.log("error pixels");
                console.log(err);
            } else if (pixels) {
                //console.log(pixels);
                gif.writeHeader();
                gif.addFrame(pixels.data);
                gif.read();
                if (counter === images.length - 1) {
                    gif.finish();
                } else {
                    addToGif(images, path, ++counter);
                }
            }

        })

    } else {
        console.log("no image!");
        console.log(img);
    }


}

exports.generate = function (images, path, callback) {
    //console.log(images);
    file = require('fs').createWriteStream(path + 'preview.gif');
    file.on("close", () => {
        console.log("gifFile ended write.");
        FilesHelper.deleteFiles(images, path);
        file.close();
    });

    gif.setQuality(20);
    gif.setDelay(200);
    /* gif.setRepeat(0); */
    gif.pipe(file);

    addToGif(images, path);
};