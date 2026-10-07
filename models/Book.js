const mongoose = require("mongoose");
const { readConnection, writeConnection } = require("../config/database");

const bookSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    vat: {
        type: Number,
        required: true
    },

    priceAfterTax: {
        type: Number,
        required: true
    }
});

const ReadBook = readConnection.model("Book", bookSchema, "books");

const WriteBook = writeConnection.model("Book", bookSchema, "books");

module.exports = {
    ReadBook,
    WriteBook
};