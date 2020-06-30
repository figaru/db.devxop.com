var fluent_ffmpeg = require("fluent-ffmpeg");
const { getVideoDurationInSeconds } = require('get-video-duration')
const fs = require("fs");

var ffmpeg = require('fluent-ffmpeg');
var mergedVideo = fluent_ffmpeg();

var filePath = process.argv[2];

var args = process.argv.slice(3);

//get video paths from args[1]+ 
let videos = args;

//get total duration of videow -> calculate percentage progress
totalDuration = 0;

//files to delete
let filesToDelete = [];

/* 

Quality	Resolution	Video Bitrate
High	960x540 / 854x480	1200 - 1500 kbps
HD 720	1280x720	1,500 - 4,000 kbps
HD 1080	1920x1080	4,000-8,000 kbps
4K	3840x2160	8,000-14,000 kbps
*/

let index = 0;
let totalProgress = 0;


let progresses = [0]; //one is for final process merger
//here we initialize progress array to calculate correct progress percentage out of the tasks running
for (let i = 0; i < videos.length; i++) {
    progresses.push(0);
}

clone();

async function clone() {
    eventEmit("conversion.start");
    let path = videos[index];

    if (path) {

        let videoPath = './tmp/' + index + '.mp4';

        const CloneAction = new Promise((resolve) => {
            //setTimeout(() => resolve('1'), 1000)

            var command = ffmpeg()
                /* .inputOptions([
                    '-preset slow',
                    '-tune film'
                ]) */
                .input(path)
                // set video bitrate
                .videoBitrate(6000)
                // set target codec
                .videoCodec("libx264")
                // set aspect ratio
                .aspect("16:9")
                // set size in percent
                .size('1920x1080')
                // set fps
                .fps(24)
                // set output format to force
                .format('mp4')
                //remove oaudio
                .noAudio();

            command.output(videoPath);


            command.on('progress', function (data) {
                //console.log(data);
                progresses[index] = data.percent;
                eventEmit("merger.progress");
            });

            command.on("error", function(err){
                console.log(err);
                event.Emit("merger.error");
            });

            command.on('end', function () {
                mergedVideo.addInput(videoPath);
                filesToDelete.push(videoPath);
                getVideoDurationInSeconds(videoPath).then((duration) => {
                    totalDuration += duration;
                });

                resolve(true);

            });

            command.run();
        });

        const result = await CloneAction;

        if (result) {
            command = null;
            if (index == videos.length - 1) {
                //console.log("finished converting");
                eventEmit("conversion.end");

                //it is finished -> run merger
                runMerger();
            } else {
                index++;
                clone();
            }
        }




    }
}



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

            progresses[progresses.length - 1] = percent;
            eventEmit("merger.progress");
        })
        .on('error', function (err) {
            eventEmit("merger.error", err);
            removeFiles();
        })
        .on('end', function () {
            removeFiles();
            //console.log('Finished!');
            var stats = fs.statSync(filePath + "video.mp4");
            eventEmit("merger.end", { "name": "video.mp4", "size": stats.size, "mimetype": "video/mp4" });
        });
}

function removeFiles() {
    filesToDelete.forEach((filePath) => {
        fs.unlink(filePath, function (err) {
            console.log(err);
        });
    });
}

function eventEmit(event = "", val = "") {

    if (event == "merger.progress") {
        val = Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length);
    }

    let res = {
        "event": event,
        "value": val
    }

    console.log(JSON.stringify(res));
}
