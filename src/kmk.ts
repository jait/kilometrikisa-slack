import axios from "axios";
import { getISOWeek, subDays } from "date-fns";
import {
    getTeamStatistics,
    kilometrikisaSession,
    getLatestContest,
    TeamStatistics,
    TeamSeries,
} from "kilometrikisa-client";
import settings from "./settings";
import * as DBApi from "./db";
import { LoggingContext, TeamMemberStats, MessageData, Text } from "./types";

const seriesNames = { [TeamSeries.SMALL]: "Piensarja", [TeamSeries.EBIKE]: "Sähkösarja" };


type TopCyclist = {
    name: string;
    score: number;
    totalDistance: number;
    distanceByRegularBike: number;
    distanceByEbike: number;
};

function yearWeek(when: Date) {
    return [when.getFullYear(), getISOWeek(when)];
}

async function postToSlack(messageData: MessageData) {
    if (!settings.SLACK_WEBHOOK_URL) {
        console.warn("No Slack webhook URL set, not posting message");
        return;
    }
    await axios.post(settings.SLACK_WEBHOOK_URL, messageData);
}

function formatFloat(value: number) {
    return value.toLocaleString(settings.SLACK_LOCALE);
}

function formatSeries(seriesData: TeamStatistics): Text | null {
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

function formatTopCyclistMessage(topCyclist: TopCyclist): MessageData {
    return {
        text: `:sports_medal: Viikon polokija on *${topCyclist.name}*, jolle matkaa kertyi yhteensä ${formatFloat(topCyclist.totalDistance)} km! :tada:`,
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

async function getLatestTeamStats(team_slug: string, contest_slug: string) {
    const session = await kilometrikisaSession({
        username: settings.KMKISA_USERNAME,
        password: settings.KMKISA_PASSWORD,
    });
    return await session.getTeamMemberStatistics(team_slug, contest_slug);
}

export async function postTopCyclist(context: LoggingContext, when?: Date, contest_slug?: string) {
    if (contest_slug == null) {
        contest_slug = (await getLatestContest()).slug;
    }
    if (when == null) {
        when = new Date();
    }
    const [year, week] = yearWeek(when);
    const [prevYear, prevWeek] = yearWeek(subDays(when, 7));
    let topCyclist: TopCyclist;

    try {
        topCyclist = await DBApi.withDb(async (db) => {
            const currentStats = await DBApi.getWeeklyStats(
                db,
                settings.TEAM_SLUG,
                contest_slug,
                year,
                week,
            );
            if (currentStats == null) {
                context.warn(`No stats found for week ${year}-${week} in ${contest_slug}`);
                return;
            }
            const previousStats = await DBApi.getWeeklyStats(
                db,
                settings.TEAM_SLUG,
                contest_slug,
                prevYear,
                prevWeek,
            );
            return getTopCyclist(currentStats, previousStats);
        });
    } catch (e) {
        context.error("Failed to get top cyclist from weekly stats");
        context.error(e);
        return;
    }

    if (topCyclist == null) {
        context.warn("No top cyclist found");
        return;
    }

    context.log(JSON.stringify(topCyclist));

    try {
        await postToSlack(formatTopCyclistMessage(topCyclist));
    } catch (e) {
        context.error("Failed to post to Slack");
        context.error(e);
    }
    return topCyclist;
}

export async function storeWeeklyStats(context: LoggingContext) {
    const team_slug = settings.TEAM_SLUG;
    let contest_slug: string;
    let stats: TeamMemberStats;
    try {
        contest_slug = (await getLatestContest()).slug;
        stats = await getLatestTeamStats(team_slug, contest_slug);
    } catch (e) {
        context.error("Failed to get latest team statistics");
        context.error(e);
        return;
    }
    const now = new Date();
    await DBApi.withDb(async (db) => {
        return await DBApi.storeWeeklyStats(db, team_slug, contest_slug, now.getFullYear(), getISOWeek(now), stats);
    });
}

// what is this shit?
function getName(element): string {
    const name = element.fullName || element.name;
    if (typeof name === "string" || name instanceof String) {
        return name.toString();
    } else {
        // "name":{"subItem":"Janis Petke","value":""}
        return name.subItem;
    }
}

type Scoring = {
    prevRegKm?: number;
    prevEKm?: number;
    regKm: number; // increase
    eKm: number; // increase
    score: number;
};

export function getTopCyclist(
    currentStats: TeamMemberStats,
    previousStats: TeamMemberStats,
): TopCyclist {
    let topCyclist: string;
    let topDistance = 0;
    let topScore = 0;
    const scores: { [name: string]: Scoring } = {};

    currentStats.distanceStatistics.forEach((el) => {
        const name = getName(el);
        scores[name] = {
            regKm: el.distanceByRegularBike || 0,
            eKm: el.distanceByEbike || 0,
            prevRegKm: 0,
            prevEKm: 0,
            score: 0,
        };
    });

    // subtract previous distance, getting the weekly increase
    if (previousStats?.distanceStatistics) {
        previousStats.distanceStatistics.forEach((prev) => {
            const name = getName(prev);
            const regKm = prev.distanceByRegularBike || 0;
            const eKm = prev.distanceByEbike || 0;
            scores[name].prevRegKm = regKm;
            scores[name].prevEKm = eKm;
            scores[name].regKm = scores[name].regKm - regKm;
            scores[name].eKm = scores[name].eKm - eKm;
        });
    }

    // secret rating algorithm
    for (const [name, scoring] of Object.entries(scores)) {
        // TODO:
        // - just the total distance increase?
        // - relative increase?
        // - number of cycling days?
        const dist = scoring.regKm + scoring.eKm / 2;
        const prevDist = scoring.prevRegKm + scoring.prevEKm / 2
        scoring.score = prevDist > 0 ? dist / prevDist : dist;
        if (scoring.score > topScore) {
            topCyclist = name;
            topScore = scoring.score;
            topDistance = dist;
        }
    }
    return topCyclist != null
        ? {
              name: topCyclist,
              score: scores[topCyclist].score,
              totalDistance: scores[topCyclist].regKm + scores[topCyclist].eKm,
              distanceByRegularBike: scores[topCyclist].regKm,
              distanceByEbike: scores[topCyclist].eKm,
          }
        : null;
}
