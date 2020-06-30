//index.mjs
const { Worker } = require('worker_threads');

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobe = require('@ffprobe-installer/ffprobe');
//const ffmpeg = require('fluent-ffmpeg');

//ffmpeg.setFfmpegPath(ffmpegInstaller.path);
//console.log(ffmpegInstaller.path, ffmpegInstaller.version);

const params = {
    files: [
        './storage/users/bxxpwy2cwGNumjWTK/XyddAoaLm9WFQzq7A/video.mp4',
        './storage/users/bxxpwy2cwGNumjWTK/eeRvbqzPhxDsTPzow/video.mp4'
    ],
    dir: './storage/test/',//'./storage/users/bxxpwy2cwGNumjWTK/eeRvbqzPhxDsTPzow/',
    ffmpeg_path: ffmpegInstaller.path,
    ffprobe_path: ffprobe.path
}

const spawnWorker = workerData => {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./test2.js', { workerData });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => code !== 0 && reject(new Error(`Worker stopped with 
        exit code ${code}`)));
    })
}

const spawnWorkers = () => {
    /* for (let t = 1; t <= 5; t++)
        spawnWorker('Hello').then(data => console.log(data)); */

    spawnWorker(params).then(data => console.log(data));
}

spawnWorkers();