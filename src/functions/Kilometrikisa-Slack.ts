import { app, HttpRequest, HttpResponseInit, InvocationContext, Timer } from "@azure/functions";

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

app.http("Kilometrikisa-Slack", {
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: KilometrikisaSlack,
});

app.timer("dailyStats", {
    schedule: "0 30 6 * 4-9 1-5",
    //schedule: '0 */5 * * * 1-5',
    handler: dailyStats,
});
