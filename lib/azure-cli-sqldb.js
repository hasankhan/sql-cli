var SqlCli = require('./cli.js'),
    _ = require('underscore');

/// Plug into the azure CLI to allow easier access to connecting
/// to the configured server and database for a given mobile service
module.exports.init = function (cli) {
    var mobile = cli.category('mobile');
    var log = cli.output;

    var mobileSQL = mobile.category('sqldb');

    mobileSQL.description('Commands to manage SQL Database');

    mobileSQL.command('query <servcename> <username> <password> <query>')
            .description('Execute a query on the associated SQL db')
            .execute(function (servicename, username, password, query, options, callback) {
                getSqlCliArgs(servicename, username, password, options, function(err, args) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    args.push('-q');
                    args.push(query);

                    runSqlCli(args);
                });
            });

    mobileSQL.command('connect <servicename> <username> <password>')
        .description('Connect to the associated SQL db')
        .execute(function (servicename, username, password, options, callback) {
            getSqlCliArgs(servicename, username, password, options, function(err, args) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    runSqlCli(args);
                });
        });

        function getSqlCliArgs(servicename, username, password, options, callback) {
            options.servicename = servicename;
            options.json = true;

            mobile.getMobileServiceApplication(options, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }

                // Look up the server and database from the resource arrays
                var sqlCliArgs = ['', 'mssql'],
                    resources = _.union(result.InternalResources.InternalResource,
                                        result.ExternalResources.ExternalResource);

                resources.forEach(function (resource) {
                    if (resource && resource.Type && resource.Name) {
                        if (resource.Type == 'Microsoft.WindowsAzure.SQLAzure.Server') {
                            sqlCliArgs.push('-s');
                            sqlCliArgs.push(resource.Name + '.database.windows.net');
                            sqlCliArgs.push('-u');
                            sqlCliArgs.push(username + '@' + resource.Name);
                            sqlCliArgs.push('-p');
                            sqlCliArgs.push(password);
                        } else if (resource.Type == 'Microsoft.WindowsAzure.SQLAzure.DataBase') {
                            sqlCliArgs.push('-d');
                            sqlCliArgs.push(resource.Name);
                        }
                    }
                });
                sqlCliArgs.push('-e');

                callback(null, sqlCliArgs);
            });
    }

    function runSqlCli(args) {
        var sqlcli = new SqlCli();
        log.json('silly', args);
        sqlcli.run(args);
    }
};