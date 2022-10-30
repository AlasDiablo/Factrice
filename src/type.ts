export type WhiteList = {
  enable: boolean;
  authorized: string[];
};

export type Tokens = {
  enable: boolean;
  authorized: Map<string, string>;
};

export type ApplicationContext = {
  host: string;
  port: number;
  username: string;
  password: string;
  whitelist: WhiteList;
  tokens: Tokens;
};
