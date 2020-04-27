exports.MONGO_ERROR = (ref) => {
    console.log(ref);
    //connected = false;
    console.log('DB: disconnected.');
    _globals.db_connected = false;
}

exports.MONGO_CONNECTED = (ref) => {
    console.log('DB: Connected!');
    _globals.db_connected = true;
}