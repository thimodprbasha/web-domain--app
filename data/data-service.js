const fs = require("fs");
const path = require("path");

let plans = [];

module.exports.initializeJSONData = function () {
  return new Promise((resolve, reject) => {
    const dataPath = path.join(__dirname, "./data.json");
    fs.readFile(dataPath, "utf-8", (error, data) => {
      if (error) reject(error);
      plans = JSON.parse(data);
      resolve(plans);
    });
  });
};
