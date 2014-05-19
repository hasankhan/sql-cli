var pjson = require('../package.json'),
    path = require('path'),
    fs = require('fs'),
    _ = require('underscore');

var Options = (function() {
    function Options() {
        this.version = pjson.version;
    }
    
    Options.prototype.init = function (argv, env) {
        var program = require('commander');
        
        program.version( this.version )
                .option( '-s, --server <server>', 'Server to conect to' )
                .option( '-u, --user <user>', 'User name to use for authentication' )
                .option( '-p, --pass <pass>', 'Password to use for authentication' )
                .option( '-o, --port <port>', 'Port to connect to' )
                .option( '-t, --timeout <timeout>', 'Connection timeout in ms' )
                .option( '-d, --database <database>', 'Database to connect to' )
                .option( '-q, --query <query>', 'The query to execute' )
                .option( '-v, --tdsVersion <tdsVersion>', 'Version of tds protocol to use [7_4, 7_2, 7_3_A, 7_3_B, 7_4]' )
                .option( '-e, --encrypt', 'Enable encryption' )
                .option( '-f, --format <format>', 'The format of output [table, csv, xml, json]')
                .option( '-c, --config <path>', 'Read connection information from config file');
                
        program.parse( argv );
        
        this.env = env;
        this.args = {};
        _.extend(this.args, _.pick(program, 'query', 'format', 'server', 
                                           'user', 'pass', 'port', 'timeout', 
                                           'database', 'query', 'tdsVersion', 
                                           'encrypt', 'format', 'config'));
    };  
    
    Options.prototype.getConnectionInfo = function() {            
        var configPath = this.args.config || 'sql-cli.json';
        
        var config = {};        

        if (fs.existsSync(configPath)) {        
            config = require(path.resolve(configPath));
        }
        
        var defaults = {            
            user: this.env.SQLCLI_USER || 'sa',
            password: this.env.SQLCLI_PASSWORD,
            server: this.env.SQLCLI_SERVER || 'localhost',
            database: this.env.SQLCLI_DATABASE,
            port: this.env.SQLCLI_PORT,
            timeout: this.env.SQLCLI_TIMEOUT,
            tdsVersion: this.env.SQLCLI_TDSVERSION,
            encrypt: this.env.SQLCLI_ENCRYPT,
        };   
        
        config = _.extend({}, defaults, this.args, config);       
        
        var connectInfo = {
            user: config.user,
            password: config.password,
            server: config.server,
            database: config.database,
            port: config.port,
            timeout: config.timeout,
            options: {
                tdsVersion: config.tdsVersion,
                encrypt: config.encrypt
            }
        };
        
        return connectInfo;
    };

    return Options;
})();

module.exports = exports = Options;