import { MongoClient, Db, Condition, Collection } from "mongodb";
import settings from "./settings";
import { TeamMemberStats } from "./types";


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

// alternatively, we could use "using" from TypeScript 5.2
export async function withDb<T>(callback: (db: Db) => Promise<T>): Promise<T> {
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
    db: Db,
    team_slug: Condition<string>,
    contest: Condition<string>,
    year: Condition<number>,
    week: Condition<number>,
) {
    const collection: Collection<WeeklyStats> = db.collection(weeklyStatsCollection);
    return await collection.findOne({ team_slug, contest, year, week });
}

export async function storeWeeklyStats(
    db: Db,
    team_slug: string,
    contest: string,
    year: number,
    week: number,
    stats: TeamMemberStats,
) {
    const collection = db.collection(weeklyStatsCollection);
    return await collection.insertOne({
        ...stats,
        team_slug,
        contest,
        year,
        week,
    });
}