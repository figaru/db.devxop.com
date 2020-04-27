const exec = require('child_process').exec;

let test = ["test/1.jpg", "test/2.jpg"];


let path = "'example/path'";


const child = exec('node createGif.js ' + path + " " + test.join(" "),
    (error, stdout, stderr) => {
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
});