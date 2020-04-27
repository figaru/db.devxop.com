var getPixels = require('get-pixels')
var GifEncoder = require('gif-encoder');
var gif = new GifEncoder(480, 270);
var file;
var fs = require('fs');

//const FilesHelper = require('../helpers/files.helper');


var addToGif = function (images, path, counter = 0) {

  let img = images[counter];
  if (img) {
    getPixels(path + images[counter], function (err, pixels) {
      if (err) {
        console.log("error pixels");
        console.log(err);
      } else if (pixels) {
        //console.log(pixels);
        //gif.writeHeader();
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

console.log("started create gif.js");
// print process.argv
var args = process.argv.slice(2);

let path = "";
let images = [];

args.forEach(function (val, index) {
  if (index == 0) {
    //assum its a path
    path = val;
  } else {
    //console.log(index + ': ' + val);
    images.push(val);
  }
});

/* console.log(path);
console.log(images);
 */
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

function generate(images, path) {
  //console.log(images);
  file = require('fs').createWriteStream(path + 'preview.gif');
  file.on("close", () => {
    console.log("gifFile ended write.");
    deleteFiles(images, path, () => {
      console.log("closing gif generating process...");
      process.exit();
    });

  });

  gif.pipe(file);
  gif.setQuality(20);
  gif.setDelay(1000);
  gif.setRepeat(0);
  gif.writeHeader();

  addToGif(images, path);
};


generate(images, path);