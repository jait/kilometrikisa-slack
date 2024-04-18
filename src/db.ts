import { MongoClient, Db, Condition } from "mongodb";
import settings from "./settings";
import { TeamMemberDistanceStatistics, TeamMemberTimeStatistics } from "kilometrikisa-client";

export type TeamMemberStats = {
    distanceStatistics: TeamMemberDistanceStatistics[];
    timeStatistics: TeamMemberTimeStatistics[];
};

type WeeklyStats = TeamMemberStats & {
    team_slug: string;
    contest: string;
    year: number;
    week: number;
};

let client: MongoClient = null;

function getClient() {
    if (client == null) {
        client = new MongoClient(settings.MONGO_DB_URI);
    }
    return client;
}

const weeklyStatsCollection = "weekly_statistics";

async function withDb(callback: (db: Db) => Promise<any>) {
    const client = getClient();
    await client.connect();
    let ret: any;
    try {
        const db = client.db(settings.MONGO_DB_DB);
        ret = await callback(db);
    } finally {
        await client.close();
    }
    return ret;
}

export async function getWeeklyStats(
    team_slug: Condition<string>,
    contest: Condition<string>,
    year: Condition<number>,
    week: Condition<number>,
): Promise<WeeklyStats> {
    return withDb(async (db) => {
        const collection = db.collection(weeklyStatsCollection);
        return await collection.findOne({ team_slug, contest, year, week });
    });
}

export async function storeWeeklyStats(
    team_slug: string,
    contest: string,
    year: number,
    week: number,
    stats: TeamMemberStats,
) {
    return withDb(async (db) => {
        const collection = db.collection(weeklyStatsCollection);
        return await collection.insertOne({
            ...stats,
            team_slug,
            contest,
            year,
            week,
        });
    });
}