import { AzureOpenAI } from "openai";
import settings from "./settings";
import { ChatCompletionMessageParam } from "openai/resources/index";

const apiVersion = '2024-10-21';

const promptMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: "Olet hauska, leikkimielisen yrityksen pyöräilykisan selostaja. \
        Kisa kestää useita kuukausia ja tilastot päivtetään kerran viikossa." },
    { role: 'user', content:
        'Kirjoita lyhyt, hauska yhteenveto viimeisen viikon tapahtumista ja viimeisimmästä tilanteesta. \
        Voit nostaa esille esim. "ohitukset" (jonkun polkijan sijoitus nousee toisen edelle), \
        tiukat kamppailut ja laiskottelijat (ei muutosta tai hyvin pieni muutos viikon tilastoissa). \
        Pyöräilyn tuntimääriin ei kannata kiinnittää juurikaan huomiota, ellei siellä ole jotain erityisen \
        kiinnostavaa huomioitavaa.' },
];

export async function getChatReport(currentStats: string, previousStats: string) {
    const client = new AzureOpenAI({ deployment: settings.OPENAI_DEPLOYMENT, apiVersion });

    const response = await client.chat.completions.create({
        model: settings.OPENAI_DEPLOYMENT,
        messages: [
            ...promptMessages,
            { role: 'user', content: `Viimeisimmät joukkueen tilastot: ${currentStats}`},
            { role: 'user', content: `Joukkueen tilastot edelliseltä viikolta: ${previousStats}`},
        ],
    });

    const { content } = response.choices[0].message;
    return content;
}

export async function getChatPraise(topCyclistName: string) {
    const client = new AzureOpenAI({ deployment: settings.OPENAI_DEPLOYMENT, apiVersion });

    const response = await client.chat.completions.create({
        model: settings.OPENAI_DEPLOYMENT,
        messages: [
            promptMessages[0],
            { role: "user", content: `Viikon polkijaksi valittiin ${topCyclistName}. \
                Kirjoita loppuun lisättäväksi lyhyt persoonallinen ja hilpeä kannustava lause.` }
        ],
    });

    const { content } = response.choices[0].message;
    return content;
}