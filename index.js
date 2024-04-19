require("dotenv").config();
const km = require("./dist/src/km");

// AWS Lambda entrypoint
exports.handler = async function (event, context) {
    console.log("Posting team stats");
    await km.postTeamStats(console);
};
