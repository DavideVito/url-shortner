const express = require("express");
const cors = require("cors");
const app = express();
const uuid = require("uuid").v4;
const admin = require("firebase-admin");
const { readFileSync } = require("fs");
const CryptoJS = require("crypto-js");
const cryptoKey = process.env.KEY;
console.log(cryptoKey);

const millisTimeout = 900000;

let shortUrls = {};

const data = readFileSync("credential.txt").toString();

const decrypted = CryptoJS.AES.decrypt(data, cryptoKey);
const object = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

admin.initializeApp({
  credential: admin.credential.cert(object),
  databaseURL: "https://prova-23591.firebaseio.com",
});

app.use(cors({ origin: "*" }));
app.use(express.json());

function validURL(str) {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}

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
  let { url } = req.body;

  if (!validURL(url)) {
    res.status(400).json({ error: `${url} is not a valid url` });
    return;
  }

  let chiave = uuid().split("-")[0];

  let coppia = { url, click: 0, chiave };

  admin
    .firestore()
    .collection("url")
    .doc(chiave)
    .set(coppia)
    .then(() => {
      res.json(coppia);
    });
});

app.get("/:id", async (req, res) => {
  let id = req.params.id;
  if (!id) {
    res.json({ error: "No Id" });
  }

  try {
    let urlRef = await admin.firestore().collection("url").doc(id);

    let url = shortUrls[id];

    if (url) {
      console.log(`Serving from cache ${id}`);

      url.timeout && clearTimeout(url.timeout);

      urlRef.update({ click: admin.firestore.FieldValue.increment(1) });
      url.timeout = setTimeout(() => {
        delete shortUrls[id];
      }, millisTimeout);

      res.redirect(url.url);
      return;
    }

    url = await urlRef.get();

    url = await url.data();
    url.timeout = setTimeout(() => {
      delete shortUrls[id];
    }, millisTimeout);

    urlRef.update({ click: admin.firestore.FieldValue.increment(1) });

    shortUrls[id] = url;
    console.log(url);
    res.redirect(url.url);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: `No entry for ${id}` });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
