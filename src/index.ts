import Config from 'config';
import {ApplicationContext, MailRoute} from './type.js';
import _ from 'lodash';
import * as fs from 'fs';
import JSON5 from 'json5';
import express from 'express';
import bodyParser from 'body-parser';
import DocumentBuilder from './document-builder';
import nodemailer from 'nodemailer';

/**
 * Fonction use to create the application context
 */
const buildContext = (): ApplicationContext => {
    /**
     * Create the default application context
     */
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

    /**
     * Get the login type
     */
    const loginType = Config.get<'config_file' | 'environment_variable'>('mail_service.login_type');

    /**
     * Get the smtp login
     */
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

    /**
     * Process whitelist
     */
    if (Config.has('whitelist') && Config.get<boolean>('whitelist.enable')) {
        context.whitelist.enable = true;
        Config.get<Array<string>>('whitelist.authorized').forEach((authorized) => {
            context.whitelist.authorized.push(authorized);
        });
    }

    /**
     * Process tokens
     */
    if (Config.has('query_token') && Config.get<boolean>('query_token.enable')) {
        context.tokens.enable = true;
        Config.get<Array<unknown>>('query_token.tokens').forEach((token) => {
            const key = _.keys(token)[0];
            context.tokens.authorized.set(key, _.get(token, key));
        });
    }

    /**
     * Get evey email template
     */
    fs.readdirSync('./config/mail_template/').forEach((path) => {
        const html = fs.readFileSync(`./config/mail_template/${path}/index.html`, {encoding: 'utf8'});
        const data = JSON5.parse<Array<{ key: string, attribute: string }>>(fs.readFileSync(`./config/mail_template/${path}/index.json5`, {encoding: 'utf8'}));
        context.mailRoute.set(path, {
            path,
            html,
            data,
        });
    });
    return context;
};

/**
 * Create application context
 */
const applicationContext: ApplicationContext = buildContext();

/**
 * Create email transporter
 */
const transporter = nodemailer.createTransport({
    pool: true,
    host: applicationContext.host,
    port: applicationContext.port,
    secure: true,
    auth: {
        user: applicationContext.username,
        pass: applicationContext.password
    }
});

/**
 * Create express app
 */
const app = express();

/**
 * Add body parser
 */
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.json());

/**
 * Send an error when the route is not available
 */
app.param(['route'], (req, res, next, value) => {
    // Todo add whitelist and token system
    if (!applicationContext.mailRoute.has(value)) {
        res.statusCode = 404;
        res.json({error: 'The asked route is not available'});
    } else {
        next();
    }
});

/**
 * Create route for each template
 */
app.post('/:route', async (req, res) => {
    const route: MailRoute | undefined = applicationContext.mailRoute.get(req.params.route);
    if (route === undefined) {
        res.statusCode = 500;
        res.json({error: 'The current route is undefined for un unknown reason'});
        return;
    }
    const document = new DocumentBuilder(route.html, route.data, req.body);
    try {
        const html = document.build();

        transporter.sendMail({
            from: req.body.from,
            to: req.body.to,
            subject: req.body.subject,
            html,
        }).then((e) => {
            console.log(e);
            res.json({message: 'Email send'});
        }).catch((err) => {
            res.statusCode = 500;
            res.json({error: err.message});
        });
    } catch (err: any) {
        res.statusCode = 400;
        res.json({error: err.message});
        return;
    }
});

/**
 * Start the server
 */
app.listen(applicationContext.server_port, () => {
    console.log(`Server started at 127.0.0.1:${applicationContext.server_port} with ${applicationContext.mailRoute.size} loaded.`);
});
