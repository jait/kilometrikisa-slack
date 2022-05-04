
const km = require('kilometrikisa-client');
const axios = require('axios');
const settings = require('./settings');


const seriesNames = {"small": "Piensarja", "electric": "Sähkösarja"};

function formatSeries(seriesData) {
	const seriesName = seriesNames[seriesData.series];
	if (!seriesName) {
		return null;
	}
	return {
		"type": "mrkdwn",
		"text": `*${seriesName}*\nSijoitus: *${seriesData.seriesPlacement}*\nJoukkueen keskiarvo: *${seriesData.distancePerPerson} km*\nKilometrit yhteensä: *${seriesData.totalDistance}*`
	};
}

function formatTeamData(teamData) {
	return {
		"blocks": [
			{
				"type": "section",
				"fields": teamData.map(formatSeries).filter(f => !!f)
			},
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "<https://www.kilometrikisa.fi/teams/boogie-bike/>"
				}
			}
		]
	}
}

async function postTeamStats() {
	const teamData = await km.getTeamStatistics(settings.TEAM_SLUG);
	//console.log(teamData);
	//console.log(formatTeamData(teamData));
	if (teamData) {
		//console.log(JSON.stringify(formatTeamData(teamData)));
		await axios.post(settings.SLACK_WEBHOOK_URL, formatTeamData(teamData));
	}
	else {
		console.warn(`No team data for ${settings.TEAM_SLUG}`);
	};
}

exports.postTeamStats = postTeamStats;
