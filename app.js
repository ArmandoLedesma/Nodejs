const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const expressLayouts = require("express-ejs-layouts");

const flash = require("express-flash");
const session = require("express-session");
const mysql = require("mysql");
const connection = require("./lib/db");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const booksRouter = require("./routes/books");
const authorsRouter = require("./routes/authors");
const categoriesRouter = require("./routes/categories");
const publishersRouter = require("./routes/publishers");
const loansRouter = require("./routes/loans");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// layout setup
app.use(expressLayouts);
app.set("layout", "layout");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Middleware para pasar la ruta actual a las vistas
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

app.use(
  session({
    cookie: { maxAge: 60000 },
    store: new session.MemoryStore(),
    saveUninitialized: true,
    resave: "true",
    secret: "secret",
  })
);

app.use(flash());

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/books", booksRouter);
app.use("/authors", authorsRouter);
app.use("/categories", categoriesRouter);
app.use("/publishers", publishersRouter);
app.use("/loans", loansRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
