const Devices = require('../models/devices.model.js');

const fs = require('fs');

// Update a file identified by the fileId in the request
exports.apkPut = (req, res) => {
    let file = req.data.file;
    file.mv('./storage/devices/apk/' + file.filename, () => {
        return res.send("file saved!");
    });
};

