const SHA256 = require("./SHA256");

const bcrypt = require("bcrypt");

// Given a 'password' from the client, extract the string that we should
// bcrypt. 'password' can be one of:
//  - String (the plaintext password)
//  - Object with 'digest' and 'algorithm' keys. 'algorithm' must be "sha-256".
//
var getPasswordString = function (password) {
    if (typeof password === "string") {
        password = SHA256(password);
    } else { // 'password' is an object
        if (password.algorithm !== "sha-256") {
            throw new Error("Invalid password hash algorithm. " +
                "Only 'sha-256' is allowed.");
        }
        password = password.digest;
    }
    return password;
};

// Use bcrypt to hash the password for storage in the database.
// `password` can be a string (in which case it will be run through
// SHA256 before bcrypt) or an object with properties `digest` and
// `algorithm` (in which case we bcrypt `password.digest`).
//
var hashPassword = function (password) {
    password = getPasswordString(password);
    return bcryptHash(password, Accounts._bcryptRounds());
};

// Extract the number of rounds used in the specified bcrypt hash.
const getRoundsFromBcryptHash = hash => {
    let rounds;
    if (hash) {
        const hashSegments = hash.split('$');
        if (hashSegments.length > 2) {
            rounds = parseInt(hashSegments[2], 10);
        }
    }
    return rounds;
};

// Check whether the provided password matches the bcrypt'ed password in
// the database user record. `password` can be a string (in which case
// it will be run through SHA256 before bcrypt) or an object with
// properties `digest` and `algorithm` (in which case we bcrypt
// `password.digest`).
//
const _checkPassword = async function (user, password) {
    var result = {
        userId: user._id,
        valid: false
    };

    
    const formattedPassword = SHA256(password);
    const hash = user.services.password.bcrypt;
    const hashRounds = getRoundsFromBcryptHash(hash);

    result.valid = await bcrypt.compare(formattedPassword, hash);/* .then((result)=>{
        console.log(result);
    }); */

   /*  if (!bcrypt.compare(formattedPassword, hash)) {
        //result.error = handleError("Incorrect password", false);
        result.error = "incorrect password";
    } else if (hash != hashRounds) {
        // The password checks out, but the user's bcrypt hash needs to be updated.

        Meteor.defer(() => {
          Meteor.users.update({ _id: user._id }, {
            $set: {
              'services.password.bcrypt':
                bcryptHash(formattedPassword, Accounts._bcryptRounds())
            }
          });
        });
        result.valid = true;
    } */

    return result;
};

module.exports = _checkPassword;