const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const handlebars = require("express-handlebars");
const controller = require("./controller");
const ENV = require("./env");
const { env } = require("process");
const planService = require("./data/data-service");
const bcryptService = require("./bycrpt-service");
const { options } = require("pg/lib/defaults");
let USER = [];

app.use(express.static("public"));
app.use("/css", express.static(__dirname + "/assets/css"));
app.use("/img", express.static(__dirname + "/assets/img"));
app.use("/js", express.static(__dirname + "/assets/js"));
app.use("/vendor", express.static(__dirname + "/assets/vendor"));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  route == "/" ? "/" : "/" + route.replace(/\/(.*)/, "");
  app.locals.activeRoute = route;
  app.locals.viewingCategory = req.query.category;
  next();
});

const hbs = handlebars.create({
  extname: "hbs",
  layoutsDir: path.join(__dirname, "/views/layout"),
  defaultLayout: "main",
  helpers: {
    signLink: function () {
      console.log(USER.found === undefined);
      return (
        '<i class="bi bi-person-circle d-flex align-items-center ms-4"><a href="/sign-in">' +
        (USER.found !== undefined ? USER.found.username : "Sign-in") +
        "</a></i>"
      );
    },
    navLink: function (url, options) {
      return (
        "<li" +
        (url == app.locals.activeRoute
          ? ' class="nav-link scrollto active" '
          : "") +
        '><a href="' +
        url +
        '">' +
        options.fn(this) +
        "</a></li>"
      );
    },
  },
});

app.set("views", path.join(__dirname, "/views"));
app.use(express.static("public"));
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", function (req, res) {
  res.status(200).redirect("/home");
});

app.get("/home", function (req, res) {
  res.render("home");
});

app.get("/plans", function (req, res) {
  planService
    .initializeJSONData()
    .then((data) => {
      console.log(data[0]);
      res.render("plans", {
        plans: data,
      });
    })
    .catch((error) => {
      console.error("Error : ", error);
    });
});

app.get("/sign-in", function (req, res) {
  res.render("signin", { layout: false });
});

app.get("/registration", function (req, res) {
  res.render("reg", { layout: false });
});

app.post("/login-data", async (req, res) => {
  let args = [req.body.email, req.body.password];
  // console.log(args);
  const findQuery = "SELECT * FROM users WHERE email=$1";
  try {
    const isUserFound = await controller.queryDB([args[0]], findQuery);
    USER = [];
    USER.found = isUserFound.rows[0];
  } catch (error) {
    console.error("ERROR : ", error);
  }
  if (USER.found) {
    const hash = USER.found.password;
    bcryptService
      .dycrptPassword(args[1], hash)
      .then((results) => {
        if (results) {
          res.redirect("/home");
        }
      })
      .catch((error) => {
        console.error("ERROR : ", error);
      });
  } else {
    console.warn("User not found !");
    res.render("signin", {
      error: "User not found",
      layout: false,
    });
  }
});

app.post("/registration-data", async (req, res) => {
  let emailValid = [];
  let args = [
    req.body.name,
    req.body.email,
    req.body.username,
    req.body.password,
  ];
  console.log(args[3]);

  const insertQuery =
    "INSERT INTO users (name,  email , username , password) VALUES ($1, $2 , $3 ,$4)";
  const emailFindQuery = "SELECT * FROM users WHERE email=$1";
  try {
    emailValid = await controller.queryDB([args[1]], emailFindQuery);
  } catch (error) {
    console.error("ERROR : ", error);
  }

  if (emailValid.rows.length === 0) {
    try {
      const hashPassword = await bcryptService.cryptPassword(10, args[3]);
      args[3] = hashPassword;
      console.log(args);
    } catch (error) {
      console.error("ERROR : ", error);
    }
    controller
      .queryDB(args, insertQuery)
      .then((results) => {
        res.redirect("/home");
      })
      .catch((error) => {
        console.error("ERROR : ", error);
      });
  } else {
    res.render("reg", {
      error: "Email not available",
      layout: false,
    });
  }
});

app.use((req, res) => {
  res.status(404).render("404", {
    Errdata: {
      CODE: 404,
      MESSAGE: "Page Not Found",
      URL: req.url,
    },
  });
});

// This use() will add an error handler function to
// catch all errors.
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).render("404", {
    Errdata: {
      CODE: 500,
      MESSAGE: "Internal Server Error",
    },
  });
});

controller
  .initializeDB()
  .then((Client) => {
    port = ENV.PORT.HOST || process.env.PORT;
    app.listen(port);
    console.log("Server started at http://localhost:" + port);
    console.log("Succesfully connected to DB : " + ENV.DB.DATABASE);
  })
  .catch((error) => {
    console.error("ERROR : ", error);
  });
