const mongoose = require('mongoose');

const FilesSchema = mongoose.Schema({
    /* _id: {type: String, required: true, unique: true} */
}, {
    timestamps: true,
    strict: false,
    noId: true,
    noVirtualId: true
});

module.exports = mongoose.model('Files', FilesSchema);