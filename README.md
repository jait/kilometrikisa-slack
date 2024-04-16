# Kilometrikisa Slack integration

## Overview

Posts latest kilometrikisa stats to Slack every day. Implemented as an Azure Function App.

## Prerequisites
- Node.js v20 or later installed
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=linux%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-typescript) installed

## Building
- `npm install` (just once)
- `npm run build`

## Deploying

To publish to the production slot, do:
`func azure functionapp publish <function name>`

To publish to another slot, add `--slot <slot-name>` argument to the command.

For configuraton, see `settings.ts` file.

## Running in production

The function runs daily at a configured time. It can also be triggered via the HTTP API, e.g. with
`curl https://<function-name>.azurewebsites.net/api/kilometrikisa-slack`.

## Running locally

The function can be tested locally by starting it with `npm start` or `func start -p <port>`.


