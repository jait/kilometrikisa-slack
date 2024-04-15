
const km = require('kilometrikisa-client');
const axios = require('axios');
const settings = require('./settings');


const seriesNames = {"small": "Piensarja", "electric": "Sähkösarja"};

async function postMessage(messageData) {
	//console.log(JSON.stringify(messageData));
	await axios.post(settings.SLACK_WEBHOOK_URL, messageData);
}

function formatFloat(value) {
	return value.toLocaleString(settings.SLACK_LOCALE);
}

function formatSeries(seriesData) {
	const seriesName = seriesNames[seriesData.series];
	if (!seriesName) {
		return null;
	}
	return {
		"type": "mrkdwn",
		"text": `*${seriesName}*\nSijoitus: *${seriesData.seriesPlacement}*\nJoukkueen keskiarvo: *${formatFloat(seriesData.distancePerPerson)} km*\nKilometrit yhteensä: *${formatFloat(seriesData.totalDistance)}*`
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

function formatTopCyclistMessage(topCyclist) {
	const totalKm = topCyclist.distanceByRegularBike + topCyclist.distanceByEbike;
	return {
		"text": `Viikon polokija on *${topCyclist.name}*, jolle matkaa kertyi yhteensä ${formatFloat(totalKm)} km! :tada:`
	};
}

async function postTeamStats() {
	const teamData = await km.getTeamStatistics(settings.TEAM_SLUG);
	//console.log(teamData);
	//console.log(formatTeamData(teamData));
	if (teamData) {
		await postMessage(formatTeamData(teamData));
	}
	else {
		console.warn(`No team data for ${settings.TEAM_SLUG}`);
	};
}

async function postTopCyclist() {
	const session = await km.kilometrikisaSession({username: settings.KMKISA_USERNAME, password: settings.KMKISA_PASSWORD});
	const contest = await km.getLatestContest();
	const currentStats = await session.getTeamMemberStatistics(settings.TEAM_SLUG, contest.slug);
	//console.log(JSON.stringify(currentStats));
	// fetch previous stats from somewhere
	previousStats = {};
	// save currentStats somewhere
	const topCyclist = getTopCyclist(currentStats, previousStats);
	console.log(topCyclist);
	await postMessage(formatTopCyclistMessage(topCyclist));
}

function getTopCyclist(currentStats, previousStats) {
	let regKmByName = {};
	let eKmByName = {};
	let topCyclist;
	let topDistance = 0;

	// what is this shit?
	function getName(element) {
		const name = element.fullName || element.name;
		if (typeof name === 'string' || name instanceof String) {
			return name;
		} else {
			// "name":{"subItem":"Janis Petke","value":""}
			return name.subItem;
		}
	}

	currentStats.distanceStatistics.forEach((el) => {
		const name = getName(el);
		regKmByName[name] = el.distanceByRegularBike || 0;
		eKmByName[name] = el.distanceByEbike || 0;
	});

	if (previousStats && previousStats.distanceStatistics) {
		previousStats.distanceStatistics.forEach((el) => {
			const name = getName(el);
			regKmByName[name] = regKmByName[name] - el.distanceByRegularBike;
			eKmByName[name] = eKmByName[name] - el.distanceByEbike;
		});
	}

	// secret rating algorithm
	for (const [name, km] of Object.entries(regKmByName)) {
		let dist = km + eKmByName[name] / 2;
		if (dist > topDistance) {
			topCyclist = name;
			topDistance = dist;
		}
	}
	return {name: topCyclist, adjustedDistance: topDistance, distanceByRegularBike: regKmByName[topCyclist], distanceByEbike: eKmByName[topCyclist]};
}

exports.postTeamStats = postTeamStats;
exports.postTopCyclist = postTopCyclist;
