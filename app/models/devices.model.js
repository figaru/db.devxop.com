const mongoose = require('mongoose');

const DevicesSchema = mongoose.Schema({
    _id: {type: String},
    device_id: {type: String},
    authorization_code: {type: String},
    published_view: {type: String},
    views: {type: Object}
}, {
    timestamps: true,
    strict: false,
    noId: true,
    noVirtualId: true
});

module.exports = mongoose.model('Devices', DevicesSchema);