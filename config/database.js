const mongoose = require("mongoose");

const mongoClientOptions = {
    serverSelectionTimeoutMS: 10_000,
    autoSelectFamily: false
};

const readConnection = mongoose.createConnection(
    process.env.MONGO_READ_URI,
    mongoClientOptions
);

const writeConnection = mongoose.createConnection(
    process.env.MONGO_WRITE_URI,
    mongoClientOptions
);

module.exports = {
    readConnection,
    writeConnection
};