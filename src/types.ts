import { TeamMemberDistanceStatistics, TeamMemberTimeStatistics } from "kilometrikisa-client";

export type LoggingContext = {
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
};

export type TeamMemberStats = {
    distanceStatistics: TeamMemberDistanceStatistics[];
    timeStatistics: TeamMemberTimeStatistics[];
};

// Slack messages

export type Text = {
    type: "plain_text" | "mrkdwn";
    text: string;
    emoji?: boolean;
    verbatim?: boolean;
};

// https://api.slack.com/reference/block-kit/blocks#blocks

type Block = {
    type: string;
    block_id?: string;
};

type SectionBlock = Block & {
    type: "section";
    text?: Text;
    fields?: Text[];
};

type HeaderBlock = Block & {
    type: "header";
    text: Text;
};

type MessageBlock = SectionBlock | HeaderBlock;

export type MessageData = {
    text?: string;
    blocks?: MessageBlock[];
};
