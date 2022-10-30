export type WhiteList = {
    enable: boolean;
    authorized: string[];
};

export type Tokens = {
    enable: boolean;
    authorized: Map<string, string>;
};

export type MailRoute = {
    path: string;
    html: string;
    data: Array<{ key: string, attribute: string }>;
}

export type ApplicationContext = {
    server_port: number;
    host: string;
    port: number;
    username: string;
    password: string;
    whitelist: WhiteList;
    tokens: Tokens;
    mailRoute: Map<string, MailRoute>;
};
