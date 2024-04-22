# Kilometrikisa Slack integration

## Overview

Posts latest daily and weekly kilometrikisa statistics to Slack. Implemented as an Azure Function App that uses MongoDB (or compatible database like Cosmos DB) for storing weekly statistics.

## Prerequisites

-   Node.js v20 or later installed
-   [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=linux%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-typescript) installed

## Building

-   `npm install` (just once)
-   `npm run build`

## Deploying

To publish to the production slot, run
`func azure functionapp publish <function name>`

To publish to another slot, add `--slot <slot-name>` argument to the command.
You should run `npm prune --omit=dev` before publishing to avoid bundling dev dependencies.

For configuraton, see `settings.ts` file.

## Running in production

The function runs daily/weekly at configured times (see Kilometrikisa-Slack.ts).
It can also be triggered via the HTTP API, e.g. with
`curl https://<function-name>.azurewebsites.net/api/daily`.

## Running locally

The function can be tested locally by starting it with `npm start` or `func start -p <port>`.
