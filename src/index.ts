import Config from 'config';
import { ApplicationContext } from './type.js';
import _ from 'lodash';

const buildContext = (): ApplicationContext => {
    const context: ApplicationContext = {
        host: Config.get<string>('mail_service.host'),
        port: Config.get<number>('mail_service.port'),
        password: '',
        username: '',
        tokens: {
            enable: false,
            authorized: new Map<string, string>(),
        },
        whitelist: {
            enable: false,
            authorized: [],
        },
    };
    const loginType = Config.get<'config_file' | 'environment_variable'>('mail_service.login_type');
    switch (loginType) {
    case 'config_file':
        context.username = Config.get<string>('mail_service.login.username');
        context.password = Config.get<string>('mail_service.login.password');
        break;
    case 'environment_variable':
        context.username = process.env.FACTRICE_USERNAME as string;
        context.password = process.env.FACTRICE_PASSWORD as string;
        break;
    default:
        throw new Error(`In-valid login type (${loginType})`);
    }
    if (Config.has('whitelist') && Config.get<boolean>('whitelist.enable')) {
        context.whitelist.enable = true;
        Config.get<Array<string>>('whitelist.authorized').forEach((authorized) => {
            context.whitelist.authorized.push(authorized);
        });
    }
    if (Config.has('query_token') && Config.get<boolean>('query_token.enable')) {
        context.tokens.enable = true;
        Config.get<Array<unknown>>('query_token.tokens').forEach((token) => {
            const key = _.keys(token)[0];
            context.tokens.authorized.set(key, _.get(token, key));
        });
    }
    return context;
};

const applicationContext: ApplicationContext = buildContext();

console.log(applicationContext);
