const mongoose = require('mongoose');

const UsersSchema = mongoose.Schema({
    /* _id: {type: String, required: true, unique: true} */
}, {
    timestamps: true,
    strict: false,
    noId: true,
    noVirtualId: true
});

module.exports = mongoose.model('Users', UsersSchema);