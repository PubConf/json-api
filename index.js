const Datastore = require("nedb");
const express = require("express");
const jsonParser = require("body-parser").json();
const path = require("path");

let app = express();
let db = {};

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.all("/:collection/*", (req, res, next) => {
  let collection = req.params.collection;
  if (!db[collection]) {
    console.log("Loading document collection: " + collection);
    db[collection] = new Datastore({
      filename: path.join("./data/", collection, "/db.json"),
      autoload: true
    });
  }
  next();
});

app.post("/:collection/", jsonParser, (req, res, next) => {
  let collection = req.params.collection;
  let document = Object.assign({}, req.body, { "_timestamp": new Date().getTime() });
  db[collection].insert(document, (err, saved) => {
    if (err) {
      res.status(500).json({ error: err.toString() });
      next();
    }
    else {
      res.status(201).json(saved);
      next();
    }
  });
});

function list(find, sort, req, res, next) {
  let collection = req.params.collection;
  db[collection]
    .find(find)
    .sort(sort)
    .exec((err, docs) => {
      if (err) {
        res.status(500).json({ error: err.toString() });
        next();
      }
      else {
        res.json(docs);
        next();
      }
    });
}

app.post("/:collection/_query", jsonParser, (req, res, next) => {
  let find = req.body.find || {};
  let sort = req.body.sort || { "_timestamp": 1 };
  list(find, sort, req, res, next);
});

app.get("/:collection/", (req, res, next) => {
  list({}, { "_timestamp": 1 }, req, res, next);
});

let port = process.env.HTTP_PORT || 5000;
console.log("Starting server on port " + port);
app.listen(port);
