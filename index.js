const express = require("express");
const cors = require("cors");
const app = express();
const uuid = require("uuid").v4;
const admin = require("firebase-admin");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "192.168.1.130",
  user: "Admin",
  password: "Password",
  database: "URL",
});

app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.static("url-shortner/build"));

app.get("/info/:id", (req, res) => {
  let id = req.params.id;
  if (!id) {
    res.json({ error: "No Id" });
  }

  try {
    let url = shortUrls[req.params.id];

    res.send(url);
  } catch (error) {
    res.status(400).send({ error: `No entry for ${id}` });
  }
});

app.post("/url", async (req, res) => {
  try {
    let { url } = req.body;

    /*
  if (!validURL(url)) {
    res.status(400).json({ error: `${url} is not a valid url` });
    return;
  }
  */

    let chiave = uuid().split("-")[0];

    let coppia = { url, click: 0, chiave };

    const query = "INSERT INTO `URL`(`id`, `url`) VALUES (?, ?)";
    const inserts = [chiave, url];

    const safeQuery = connection.format(query, inserts);

    connection.query(safeQuery, () => {
      res.status(201).json({ chiave });
    });
  } catch (error) {
    res.status(400).json(error.message);
  }
});

app.get("/:id", async (req, res) => {
  let id = req.params.id;

  if (!id) {
    res.json({ error: "No Id" });
  }
  const cUrl = myCache.get(id);

  if (cUrl) {
    return res.redirect(cUrl);
  }
  const query = "SELECT url from URL where id = ?";
  const inserts = [id];

  const safeQuery = connection.format(query, inserts);

  connection.query(safeQuery, (err, ris) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (!ris[0]) {
      return res.status(404).send();
    }

    const url = ris[0].url;

    myCache.set(id, url, 600);

    return res.redirect(url);

    // res.redirect(res[0].url);
  });
});

const port = process.env.PORT || 3000;

const main = () => {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
};
connection.connect(main);
