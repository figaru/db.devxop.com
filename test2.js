const { workerData, parentPort, threadId } = require('worker_threads');


console.log(workerData);


var fluent_ffmpeg = require("fluent-ffmpeg");
const { getVideoDurationInSeconds } = require('get-video-duration')
const fs = require("fs");

//const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(workerData.ffmpeg_path);
ffmpeg.setFfprobePath(workerData.ffprobe_path);

var mergedVideo = fluent_ffmpeg({ priority: 10 });

var filePath = workerData.dir;

//get video paths from args[1]+ 
let videos = workerData.files;

//get total duration of videow -> calculate percentage progress
totalDuration = 0;

//files to delete
let filesToDelete = [];


videos.forEach(function (path, i) {

    console.log(path);

    var ffmpeg = require('fluent-ffmpeg');
    var command = ffmpeg(path)
        // set video bitrate
        .videoBitrate(1024)
        // set target codec
        .videoCodec("libx264")
        // set aspect ratio
        .aspect("16:9")
        // set size in percent
        .size('1080x1920')
        // set fps
        .fps(29)
        // set audio bitrate
        .audioBitrate('128k')
        // set audio codec
        .audioCodec('libmp3lame')
        // set number of audio channels
        .audioChannels(2)
        // set output format to force
        .format('mp4')
        //remove oaudio
        .noAudio();


    let videoPath = './tmp/' + i + '.mp4';

    eventEmit("conversion.start");

    command.clone()
        .size('1080x1920').aspect('16:9')//.autopad()
        .noAudio()
        .save(videoPath)
        .on("end", function () {
            mergedVideo.addInput(videoPath);
            filesToDelete.push(videoPath);
            getVideoDurationInSeconds(videoPath).then((duration) => {
                totalDuration += duration;

                if (i == videos.length - 1) {
                    eventEmit("conversion.end");
                    
                    //it is finished -> run merger
                    runMerger();
                }
            });


        });
    /* console.log(path);
    mergedVideo = mergedVideo.mergeAdd(path); */

    // mergedVideo = mergedVideo.mergeAdd('./tmp/'+i+'.mp4');
});

//runMerger();


function runMerger() {
    eventEmit("merger.start");

    mergedVideo.mergeToFile(filePath + 'video.mp4', './tmp/')
        .on('progress', function (progress) {
            var hms = progress.timemark;   // your input string
            var a = hms.split(':'); // split it at the colons

            // minutes are worth 60 seconds. Hours are worth 60 minutes.
            var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);

            let percent = Math.round((seconds / totalDuration) * 100);

            eventEmit("merger.progress", percent);
        })
        .on('error', function (err) {
            console.log(err);
            eventEmit("merger.error", err);
            removeFiles();
        })
        .on('end', function () {
            removeFiles();
            //console.log('Finished!');
            var stats = fs.statSync(filePath + "video.mp4");
            eventEmit("merger.end", {"name": "video.mp4", "size": stats.size, "mimetype": "video/mp4"});
        });
}

function removeFiles(){
    filesToDelete.forEach((filePath)=>{
        fs.unlink(filePath, function(err){
            console.log(err);
        });
    });
}

function eventEmit(event = "", val = ""){

    let res = {
        "event": event,
        "value": val
    }

    console.log(JSON.stringify(res));
    //parentPort.postMessage(res);
}


// You can do any cpu intensive tasks here, in a synchronous way
// without blocking the "main thread"
