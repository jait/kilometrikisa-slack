
require('dotenv').config();
const km = require('./km');

exports.handler = async function(event, context) {
	console.log("Posting team stats");
	await km.postTeamStats();
}