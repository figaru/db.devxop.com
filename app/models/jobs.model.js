const mongoose = require('mongoose');

const JobSchema = mongoose.Schema({
    _id: { type: String, required: true },
    foreign_type: { type: String },
    foreign_id: { type: String },
    user_id: { type: String },
    action: { type: String },
    progress: { type: Number },
    end: { type: Boolean },
    error: { type: Boolean },
    error_msg: {type: String},
    start: { type: Boolean },
    start_stamp: { type: Number },
    end_stamp: { type: Number },
    params: { type: Object },
    script_based: { type: Boolean },
    script: { type: String }
}, {
    timestamps: true,
    strict: false,
    noId: true,
    noVirtualId: true
});

module.exports = mongoose.model('Jobs', JobSchema);