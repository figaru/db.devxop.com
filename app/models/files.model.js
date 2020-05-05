const mongoose = require('mongoose');

const FilesSchema = mongoose.Schema({
    _id: {type: String, required: true},
    file: {type: Object},
    extension: {type: String},
    user_id: {type: String},

}, {
    timestamps: true,
    strict: false,
    noId: true,
    noVirtualId: true
});

module.exports = mongoose.model('Files', FilesSchema);