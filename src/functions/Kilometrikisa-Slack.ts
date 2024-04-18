import { app, HttpRequest, HttpResponseInit, InvocationContext, Timer } from "@azure/functions";
import { lastDayOfISOWeek, subDays } from "date-fns";

require("dotenv").config({ silent: true });
import * as km from "../km";

export async function KilometrikisaSlack(
    request: HttpRequest,
    context: InvocationContext,
): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const ret = await km.postTeamStats(context);

    return { jsonBody: ret || undefined, body: ret ? undefined : "fail", status: ret ? 200 : 500 };
}

export async function dailyStats(timer: Timer, context: InvocationContext): Promise<void> {
    context.log("Posting daily statistics");
    await km.postTeamStats(context);
}

export async function storeWeeklyStats(timer: Timer, context: InvocationContext): Promise<void> {
    context.log("Storing weekly statistics");
    await km.storeWeeklyStats(context);
}

export async function postWeeklyStats(timer: Timer, context: InvocationContext): Promise<void> {
    context.log("Posting weekly statistics");
    // when = previous week's Sunday
    await km.postTopCyclist(context, lastDayOfISOWeek(subDays(new Date(), 7)));
}

app.http("Kilometrikisa-Slack", {
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: KilometrikisaSlack,
});

app.timer("postDailyStats", {
    schedule: "0 0 6 * 4-9 1-5",
    //schedule: "0 30 6 * 5-9 1-5",
    handler: dailyStats,
});

app.timer("storeWeeklyStats", {
    schedule: "0 0 20 * 4-9 0",
    //schedule: "0 0 20 * 5-9 0",
    handler: storeWeeklyStats,
});

app.timer("postWeeklyStats", {
    schedule: "30 0 6 * 4-9 1",
    //schedule: "30 0 6 * 5-9 1",
    handler: postWeeklyStats,
});