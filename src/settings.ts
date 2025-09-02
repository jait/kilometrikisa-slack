const settings = {
    TEAM_SLUG: process.env.TEAM_SLUG as string,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL as string,
    KMKISA_USERNAME: process.env.KMKISA_USERNAME as string,
    KMKISA_PASSWORD: process.env.KMKISA_PASSWORD as string,
    SLACK_LOCALE: "fi-FI",
    MONGO_DB_URI: process.env.MONGO_DB_URI as string,
    MONGO_DB_DB: process.env.MONGO_DB_DB,
    OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT as string,
};

export default settings;
