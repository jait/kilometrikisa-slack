import { app, HttpRequest, HttpResponseInit, InvocationContext, Timer } from "@azure/functions";
import { lastDayOfISOWeek, subDays } from "date-fns";

require("dotenv").config({ silent: true });
import * as km from "../km";


function jsonResponse(body: any): HttpResponseInit {
    return { jsonBody: body || undefined, body: body ? undefined : "fail", status: body ? 200 : 500 };
};

export async function daily(
    request: HttpRequest,
    context: InvocationContext,
): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const ret = await km.postTeamStats(context);
    return jsonResponse(ret);
}

export async function weekly(
    request: HttpRequest,
    context: InvocationContext,
): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const ret = await km.postTopCyclist(context, lastDayOfISOWeek(subDays(new Date(), 7)));
    return jsonResponse(ret);
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

app.http("daily", {
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: daily,
});

app.http("weekly", {
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: weekly,
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