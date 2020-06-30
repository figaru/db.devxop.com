
var validate = require('express-jsonschema').validate;
const FilesSchema = require("./schemas/files.schema.js");

module.exports = (app) => {
    const files = require('../controllers/files.controller.js');

    // Create a new file
    app.post('/files', validate({data: FilesSchema.create}), files.create);

    // Retrieve all files
    app.get('/files', files.findAll);

    // Retrieve a single file with fileId
    app.get('/files/:userId/:fileId', files.findOne);

    // Update a file with fileId
    app.put('/files/:userId/:fileId', files.update);

    // Delete a file with fileId
    app.delete('/files', validate({data: FilesSchema.delete}), files.delete);



    // Create a new file
    app.post('/files/video/merger', files.videoMerger);

}