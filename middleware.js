
// Create and Save a new Note
exports.MongoValidation = (req, res, next) => {
    //console.log("Db Connection Valid: " + globals.db_connected);
    if (!_globals.db_connected) {
        res.status(500).send("database connection unavailable.");
    } else {
        req["data"] = extend(req.query, req.params, req.body, req.files);
        //console.log(req.data);

        // keep executing the router middleware
        next()
    }


};

exports.SchemaError = (err, req, res, next) => {
    if (err.name === 'JsonSchemaValidation') {
        // Log the error however you please
        console.log(err.message);// logs "express-jsonschema: Invalid data found"

        // Set a bad request http response status or whatever you want
        res.status(400).send("invalid data schema found.");

    } else {
        // pass error to next error middleware handler
        next(err);
    }
};

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}