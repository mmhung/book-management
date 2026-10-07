const express = require("express");
const router = express.Router();

const { ReadBook, WriteBook } = require("../models/Book");


// =========================
// GET - ĐỌC DANH SÁCH SÁCH
// =========================
router.get("/books", async (req, res) => {
    try {
        const books = await ReadBook.find();

        res.render("index", {
            books: books,
            fullName: process.env.FULL_NAME,
            mssv: process.env.MSSV,
            vat: process.env.VAT
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi đọc dữ liệu");
    }
});


// =========================
// GET - FORM THÊM SÁCH
// =========================
router.get("/books/add", (req, res) => {
    res.render("add");
});


// =========================
// POST - THÊM SÁCH
// =========================
router.post("/books", async (req, res) => {

    try {

        const { productId, name, price } = req.body;

        // Kiểm tra prefix MSSV
        if (!productId.startsWith(process.env.PREFIX)) {
            return res.status(400).send(
                `Mã sản phẩm phải bắt đầu bằng ${process.env.PREFIX}`
            );
        }

        // Tính VAT
        const vat = Number(process.env.VAT);

        // Tính giá sau thuế
        const priceAfterTax =
            Number(price) * (1 + vat / 100);

        await WriteBook.create({
            productId,
            name,
            price,
            vat,
            priceAfterTax
        });

        res.redirect("/books");

    } catch (error) {

        console.error(error);

        res.status(500).send("Lỗi thêm sách");
    }
});

module.exports = router;