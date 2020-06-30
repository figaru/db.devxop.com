const mongoose = require('mongoose');

const DevicesSchema = mongoose.Schema({
    _id: {type: String},
    device_id: {type: String},
    authorization_code: {type: String},
    published_view: {type: String},
    views: {type: Object},
    socket_id: {type: String},
    ping_stamp: {type: Number},
    startup_stamp: {type: Number},
    v_id: {type: Number}
}, {
    timestamps: true,
    strict: false,
    noId: true,
    noVirtualId: true
});

module.exports = mongoose.model('Devices', DevicesSchema);