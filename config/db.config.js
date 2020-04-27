module.exports = {
    _connected: false,
    url: '',
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        auto_reconnect: true,
        /* reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 5000, DEPRECATED with UNIFIED TOPOLOGY*/
        /* socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } */
    },
}