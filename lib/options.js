(function () {
    "use strict";

    var pjson = require('../package.json'),
        path = require('path'),
        fs = require('fs'),
        _ = require('underscore'),
        sprintf = require("sprintf-js").sprintf,
        passPrompt = require('password-prompt');

    var DEFAULT_CONFIG = 'mssql-conf.json';

    class Options {
        constructor() {
            this.version = pjson.version;
        }

        init(argv, env) {
            return new Promise((resolve, reject)=>
            {
                var program = require('commander');

                program.version(this.version)
                    .option('-s, --server <server>', 'Server to connect to')
                    .option('-u, --user <user>', 'User name to use for authentication')
                    .option('-p, --pass [pass]', 'Password to use for authentication')
                    .option('-o, --port <port>', 'Port to connect to')
                    .option('-t, --timeout <timeout>', 'Connection timeout in ms')
                    .option('-T, --requestTimeout <timeout>', 'Request timeout in ms')
                    .option('-d, --database <database>', 'Database to connect to')
                    .option('-q, --query <query>', 'The query to execute')
                    .option('-v, --tdsVersion <tdsVersion>', 'Version of tds protocol to use [7_4, 7_2, 7_3_A, 7_3_B, 7_4]')
                    .option('-e, --encrypt', 'Enable encryption')
                    .option('-f, --format <format>', 'The format of output [table, csv, xml, json]')
                    .option('-c, --config <path>', 'Read connection information from config file');

                program.parse(argv);

                this.env = env;
                this.args = {};
                _.extend(this.args, _.pick(program, 'server', 'user', 'pass',
                    'port', 'requestTimeout', 'timeout',
                    'database', 'query', 'tdsVersion',
                    'encrypt', 'format', 'config'));

                if (this.args.config && !fs.existsSync(this.args.config)) {
                    reject(sprintf('config file \'%s\' does not exist.', this.args.config));
                }
                // if -p or --pass option is specified without a value then prompt
                else if (this.args.pass === true) {
                    return passPrompt('Enter password: ', { method: 'hide' }).then(pass => {
                        this.args.pass = pass;
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        }

        getConnectionInfo() {
            var args = this.args || {},
                env = this.env || {},
                configPath = args.config || DEFAULT_CONFIG;

            var config = {};

            if (fs.existsSync(configPath)) {
                config = require(path.resolve(configPath));
            }

            var defaults = {
                user: env.SQLCLI_USER || 'sa',
                pass: env.SQLCLI_PASSWORD,
                server: env.SQLCLI_SERVER || 'localhost',
                database: env.SQLCLI_DATABASE,
                port: env.SQLCLI_PORT,
                timeout: env.SQLCLI_TIMEOUT,
                requestTimeout: env.SQLCLI_REQUEST_TIMEOUT,
                tdsVersion: env.SQLCLI_TDSVERSION,
                encrypt: env.SQLCLI_ENCRYPT,
            };

            config = _.extend({}, defaults, config, args);

            var connectInfo = {
                user: config.user,
                password: config.pass,
                server: config.server,
                database: config.database,
                timeout: config.timeout,
                requestTimeout: config.requestTimeout,
                options: {
                    port: config.port,
                    tdsVersion: config.tdsVersion,
                    encrypt: !!config.encrypt
                },
                pool: {
                    max: 1,
                    min: 1
                }
            };

            return connectInfo;
        }
    }

    module.exports = exports = Options;

} ());
