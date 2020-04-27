exports.create = {
    type: 'object',
    properties: {
        file: {
            type: 'object',
            required: true
        },
        user_id: {
            type: 'string',
            required: true
        }
    }
};

exports.delete = {
    type: 'object',
    properties: {
        file_id: {
            type: 'string',
            required: true
        },
        user_id: {
            type: 'string',
            required: true
        }
    }
};