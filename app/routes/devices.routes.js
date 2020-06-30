
var validate = require('express-jsonschema').validate;
const FilesSchema = require("./schemas/files.schema.js");

module.exports = (app) => {
    const files = require('../controllers/files.controller.js');

    // Create a new file
    //app.post('/devices', validate({data: FilesSchema.create}), files.create);

    // Retrieve all files
    app.get('/devices/apk', );

    // Retrieve a single file with fileId
    //app.get('/files/:userId/:fileId', files.findOne);

    // Update a file with fileId
    app.put('/devices/apk', files.apkPut();

    // Delete a file with fileId
    //app.delete('/files', validate({data: FilesSchema.delete}), files.delete);

}