exports.getFileDir = (userId, fileId) =>{
    return _globals.storage_location + userId + '/' + fileId + '/';
}   