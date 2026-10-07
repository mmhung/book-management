require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const { readConnection, writeConnection } = require("./config/database");
const { WriteBook } = require("./models/Book");
const bookRoutes = require("./routes/bookRoutes");

const app = express();


// =========================
// CẤU HÌNH EXPRESS
// =========================

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(express.static("public"));


// =========================
// HANDLEBARS
// =========================

app.set("view engine", "hbs");


function printMongoHelp(error) {
    const message = error?.message ?? String(error);

    if (
        message.includes("SSL") ||
        message.includes("alert internal") ||
        message.includes("ERR_SSL")
    ) {
        console.error(`
Không kết nối được MongoDB Atlas (lỗi TLS / SSL alert 80).

Thường gặp khi:
  1. IP máy bạn chưa có trong Atlas → Network Access → Add Current IP
     (hoặc tạm 0.0.0.0/0 để kiểm tra — chỉ dùng khi học/thử).
  2. Sai user/password trong MONGO_READ_URI hoặc MONGO_WRITE_URI
     (Database Access → user hungread / hungwrite).
  3. Node.js quá mới (ví dụ v24): thử Node 20 LTS (nvm use 20).
`);
    } else {
        console.error("\nKhông kết nối được MongoDB Atlas.\n");
    }

    console.error("Chi tiết:", message);
}

async function printPublicIpHint() {
    try {
        const response = await fetch("https://api.ipify.org?format=text");
        const ip = (await response.text()).trim();
        if (ip) {
            console.error(`IP public hiện tại (thêm vào Atlas Network Access): ${ip}`);
        }
    } catch {
        // bỏ qua nếu không lấy được IP
    }
}

async function connectDatabases() {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await Promise.all([
                readConnection.asPromise(),
                writeConnection.asPromise()
            ]);
            return;
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }
}

async function recalculateBooksVat() {
    const vat = Number(process.env.VAT);
    if (!Number.isFinite(vat)) {
        return;
    }

    const multiplier = 1 + vat / 100;

    await WriteBook.updateMany(
        {},
        [
            {
                $set: {
                    vat,
                    priceAfterTax: { $multiply: ["$price", multiplier] }
                }
            }
        ],
        { updatePipeline: true }
    );
}

async function startServer() {
    try {
        await connectDatabases();
    } catch (error) {
        printMongoHelp(error);
        await printPublicIpHint();
        process.exit(1);
    }

    try {
        await recalculateBooksVat();
    } catch (error) {
        console.error("Đã kết nối MongoDB nhưng không cập nhật VAT cho sách:", error.message);
    }

    app.use(
        session({
            secret: process.env.SESSION_SECRET || "secret-key",
            resave: false,
            saveUninitialized: false,

            store: MongoStore.create({
                client: writeConnection.getClient(),
                collectionName: "sessions",
                // User DB thường chỉ có quyền CRUD, không có createIndex
                autoRemove: "disabled"
            }),

            cookie: {
                maxAge: 1000 * 60 * 60
            }
        })
    );

    app.use("/", bookRoutes);

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

startServer();
