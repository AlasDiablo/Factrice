import Config from 'config';
import {ApplicationContext, MailRoute} from './type.js';
import _ from 'lodash';
import * as fs from 'fs';
import JSON5 from 'json5';
import express from 'express';
import bodyParser from 'body-parser';
import DocumentBuilder from "./document-builder";


const buildContext = (): ApplicationContext => {
    const context: ApplicationContext = {
        server_port: Config.get<number>('server_port'),
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
        mailRoute: new Map<string, MailRoute>(),
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
    fs.readdirSync('./config/mail_template/').forEach((path) => {
        const html = fs.readFileSync(`./config/mail_template/${path}/index.html`, {encoding: 'utf8'});
        const data = JSON5.parse<Array<string>>(fs.readFileSync(`./config/mail_template/${path}/index.json5`, {encoding: 'utf8'}));
        context.mailRoute.set(path, {
            path,
            html,
            data,
        });
    });
    return context;
};

const applicationContext: ApplicationContext = buildContext();

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.json());

app.param(['route'], (req, res, next, value) => {
    if (!applicationContext.mailRoute.has(value)) {
        res.statusCode = 404;
        res.json({error: 'The asked route is not available'});
    } else {
        next();
    }
});

app.get('/:route', (req, res) => {
    const route: MailRoute | undefined = applicationContext.mailRoute.get(req.params.route);
    if (route === undefined) {
        res.statusCode = 500;
        res.json({ error: 'The current route is undefined for un unknown reason' });
        return;
    }
    const document = new DocumentBuilder(route.html, req.query);
    // Todo
    res.send(document.build());
});

app.listen(applicationContext.server_port, () => {
    console.log(`Server started at 127.0.0.1:${applicationContext.server_port} with ${applicationContext.mailRoute.size} loaded.`);
});
