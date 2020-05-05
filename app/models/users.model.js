const mongoose = require('mongoose');

const UsersSchema = mongoose.Schema({
    _id: {type: String},
    services: {type: Object},
    emails: {type: Array},
    profile: {type: Object}
}, {
    timestamps: true,
    strict: false,
    noId: true,
    noVirtualId: true
});

module.exports = mongoose.model('Users', UsersSchema);