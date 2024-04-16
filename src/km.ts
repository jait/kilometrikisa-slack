const axios = require("axios");
import {
    getTeamStatistics,
    kilometrikisaSession,
    getLatestContest,
    TeamStatistics,
    TeamSeries,
} from "kilometrikisa-client";
import settings from "./settings";

const seriesNames = { [TeamSeries.SMALL]: "Piensarja", [TeamSeries.EBIKE]: "Sähkösarja" };

type MessageData = {
    [key: string]: any;
};

type LoggingContext = {
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
};

async function postToSlack(messageData: MessageData) {
    console.log(JSON.stringify(messageData));
    console.log(settings.SLACK_WEBHOOK_URL);
    if (!settings.SLACK_WEBHOOK_URL) {
        console.warn("No Slack webhook URL set, not posting message");
        return;
    }
    await axios.post(settings.SLACK_WEBHOOK_URL, messageData);
}

function formatFloat(value: number) {
    return value.toLocaleString(settings.SLACK_LOCALE);
}

type MessageField = {
    type: string;
    text: string;
};

function formatSeries(seriesData: TeamStatistics): MessageField | null {
    const seriesName = seriesNames[seriesData.series];
    if (!seriesName) {
        return null;
    }
    return {
        type: "mrkdwn",
        text: `*${seriesName}*\nSijoitus: *${seriesData.seriesPlacement || "-"}*\nJoukkueen keskiarvo: *${formatFloat(seriesData.distancePerPerson)} km*\nKilometrit yhteensä: *${formatFloat(seriesData.totalDistance)}*`,
    };
}

function formatTeamData(teamData: TeamStatistics[]): MessageData {
    return {
        blocks: [
            {
                type: "section",
                fields: teamData.map(formatSeries).filter((f) => !!f),
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `<https://www.kilometrikisa.fi/teams/${settings.TEAM_SLUG}/>`,
                },
            },
        ],
    };
}

function formatTopCyclistMessage(topCyclist) {
    const totalKm = topCyclist.distanceByRegularBike + topCyclist.distanceByEbike;
    return {
        text: `Viikon polokija on *${topCyclist.name}*, jolle matkaa kertyi yhteensä ${formatFloat(totalKm)} km! :tada:`,
    };
}

export async function postTeamStats(context: LoggingContext) {
    let teamData: TeamStatistics[];
    try {
        teamData = await getTeamStatistics(settings.TEAM_SLUG);
    } catch (e) {
        context.error(`Failed to get team statistics for ${settings.TEAM_SLUG}`);
        context.error(e);
        return;
    }
    if (teamData) {
        try {
            await postToSlack(formatTeamData(teamData));
            context.log("Team statistics posted to Slack");
        } catch (e) {
            context.error("Failed to post to Slack");
            context.error(e);
        }
    } else {
        context.warn(`No team data for ${settings.TEAM_SLUG}`);
    }
    return teamData;
}

export async function postTopCyclist() {
    const session = await kilometrikisaSession({
        username: settings.KMKISA_USERNAME,
        password: settings.KMKISA_PASSWORD,
    });
    const contest = await getLatestContest();
    const currentStats = await session.getTeamMemberStatistics(settings.TEAM_SLUG, contest.slug);
    //console.log(JSON.stringify(currentStats));
    // fetch previous stats from somewhere
    let previousStats = {};
    // save currentStats somewhere
    const topCyclist = getTopCyclist(currentStats, previousStats);
    console.log(topCyclist);
    await postToSlack(formatTopCyclistMessage(topCyclist));
}

function getTopCyclist(currentStats, previousStats) {
    let regKmByName: { [key: string]: number } = {};
    let eKmByName: { [key: string]: number } = {};
    let topCyclist;
    let topDistance = 0;

    // what is this shit?
    function getName(element) {
        const name = element.fullName || element.name;
        if (typeof name === "string" || name instanceof String) {
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
        const dist = km + eKmByName[name] / 2;
        if (dist > topDistance) {
            topCyclist = name;
            topDistance = dist;
        }
    }
    return {
        name: topCyclist,
        adjustedDistance: topDistance,
        distanceByRegularBike: regKmByName[topCyclist],
        distanceByEbike: eKmByName[topCyclist],
    };
}
