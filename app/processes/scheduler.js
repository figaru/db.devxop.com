

const schedule = require('node-schedule');
const Fs = require('fs');
const FileHelper = require("../helpers/files.helper");
const Random = require("../utils/random.utils");
const Jobs = require("../models/jobs.model");
const Files = require("../models/files.model");
const run = require('child_process').exec;

const JOB_START = "job.start";
const JOB_END = "job.end";
const JOB_PROGRESS = "job.progress";
const JOB_ERR = "job.error";


exports.setupScheduler = () => {
    let findRunning = { "start": true, "end": false };
    let findNew = { "start": false, "end": false };

    var j = schedule.scheduleJob('*/15 * * * * *', function () {

        Jobs.findOne(findRunning).then((jobRunning) => {
            if (jobRunning) {
                //a process is running -> do nothing
                //console.log("A process is running.");
            } else {
                //no processes running -> run next one
                //console.log("No process running. Running next if exists");
                Jobs.findOne(findNew).sort('createdAt').then((job) => {
                    if (job) {
                        //console.log(job);
                        //console.log("Starting a new scheduled job");
                        try{
                            mergerJob(job);
                        }catch(e){
                            updateJob(job._id, JOB_ERR, e);
                        }
                        
                    }
                });
            }
        });
    });

    console.log("Scheduler is running...");
}

function updateJob(jobId, event, value) {


    let setQuery = null;
    switch (event) {
        case JOB_START:
            setQuery = {
                start: true,
                start_stamp: new Date().getTime()
            }
            break;

        case JOB_END:
            setQuery = {
                end: true,
                end_stamp: new Date().getTime()
            }
            break;

        case JOB_PROGRESS:
            setQuery = {
                progress: value,
            }
            break;

        case JOB_ERR:
            setQuery = {
                end: true,
                error: true,
                error_msg: value,
                end_stamp: new Date().getTime()
            }
            break;

        default:
            break;
    }

    setQuery["update_stamp"] = new Date().getTime();

    if (setQuery) {
        Jobs.updateOne({ "_id": jobId }, {
            $set: setQuery
        }).then(() => {
            //console.log("Job updated");
        });
    }

}


function mergerJob(job) {


    /* params: {
        user_id: userId, //user to create file to
        file_id: RandomId.id(), //the file id to be used in the creation
        files: files //array of file ids to be used to merge
    } */
    let params = job.params;

    if (!params.user_id || !params.file_id || !params.files || !params.title) {
        updateJob(job._id, JOB_ERR, "Invalid params");
    } else {
        updateJob(job._id, JOB_START);

        Files.find({ "_id": { $in: params.files } }).then((fileList) => {

            

            if (fileList && fileList.length > 0) {
                //all seems good -> files to merge exist
                //create directory for new video file

                let fileDir = FileHelper.getLocalDir(params.file_id, params.user_id);
                Fs.mkdir(fileDir, function (err) {
                    if (err) {
                        //console.log(err);
                        //console.log("failed to create directory");
                        updateJob(job._id, JOB_ERR, "[failed to create dir] " + err);
                    } else {
                        let tempScript = ["node", "./app/processes/merger.process.js", fileDir];

                        fileList.forEach((file) => {
                            //add file paths to script
                            tempScript.push(FileHelper.getLocalPath(file));
                            
                        });

                        //console.log(tempScript);

                        let script = tempScript.toString().replace(/,/g, ' ');

                        const ls = run(script);
                        let increment = 0; //used to only log every 10%
                        ls.stdout.on('data', (data) => {

                            try {
                                data = JSON.parse(data);
                                let event = data.event;
                                let value = data.value;
                                //console.log(data);

                                switch (event) {
                                    case "conversion.start":
                                        //console.log("conversion started...")
                                        break;
                                    case "conversion.end":
                                        //console.log("conversion finished.")
                                        break;
                                    case "merger.start":
                                        //console.log("Merging files together...")
                                        break;
                                    case "merger.end":
                                        let obj = {
                                            _id: params.file_id,
                                            user_id: params.user_id,
                                            title: params.title,
                                            is_video: true,
                                            file: value,
                                            is_collection: true,
                                            extension: "mp4",
                                            create_stamp: new Date().getTime(),
                                            update_stamp: new Date().getTime(),
                                        }

                                        const fileObj = new Files(obj);

                                        // Save File in the database
                                        fileObj.save()
                                            .then(createdFile => {
                                                //console.log("file has been created");
                                                updateJob(job._id, JOB_END, "File has been created and saved!");

                                                FileHelper.generatePreloadVideo(fileDir + "video.mp4", fileDir);
                                            }).catch(() => {
                                                updateJob(job._id, JOB_ERR, "Failed to save file in db");
                                            })


                                        break;
                                    case "merger.error":
                                        updateJob(job._id, JOB_ERR, "[Error while merging] " + value);
                                        break;
                                    case "merger.progress":
                                        /* console.log("Progress: " + value); */
                                        if ((value / increment) >= 1) {
                                            increment += 10;
                                            updateJob(job._id, JOB_PROGRESS, value);
                                        }

                                        break;

                                    default:
                                        break;
                                }
                            } catch (e) {
                                //console.log(data);
                                //updateJob(job._id, JOB_ERR, "[Error while merging] " + e);
                            }


                        });

                        ls.on('close', (code) => {
                            if (code == 1) {
                                updateJob(job._id, JOB_ERR, "An error occured while merging -> code 1");
                            }
                            //console.log(`child process close all stdio with code ${code}`);
                        });

                        ls.on('exit', (code) => {
                            if(code == 1){
                                updateJob(job._id, JOB_ERR, "An error occured while merging -> code 1");
                            }
                            //console.log(`child process exited with code ${code}`);
                        });
                    }

                });
            } else {
                updateJob(job._id, JOB_ERR, "Could not find files to merge in db");
            }

        });
    }
}
