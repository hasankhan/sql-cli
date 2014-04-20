var SqlCli = require('./cli.js'),
    _ = require('underscore');

/// Plug into the azure CLI to allow easier access to connecting
/// to the configured server and database for a given mobile service
module.exports.init = function (cli) {
    var mobile = cli.category('mobile');
    var log = cli.output;

    var mobileSQL = mobile.category('sqldb');

    mobileSQL.description('Commands to manage SQL Database');

	mobileSQL.command('connect [servicename] [username] [password]')
        .description('Connect to the associated SQL db')
        .execute(function (servicename, username, password, options, callback) {
			log.info(servicename);
        	options.servicename = servicename;
        	options.json = true;

			log.json(options);

        	mobile.getMobileServiceApplication(options, function (error, result) {
                if (error) {
                    callback(error);
                    return;            
                }

                // Look up the server and database from the resource arrays
                var resources = _.union(result.InternalResources.InternalResource, 
                                        result.ExternalResources.ExternalResource),
                    options = ['', ''];

                resources.forEach(function (resource) {
                    if (resource.Type == 'Microsoft.WindowsAzure.SQLAzure.Server') {
                        options.push('-s');
                        options.push(resource.Name + '.database.windows.net');
                        options.push('-u');
                        options.push(username + '@' + resource.Name);
                        options.push('-p');
                        options.push(password);

                    } else if (resource.Type == 'Microsoft.WindowsAzure.SQLAzure.DataBase') {
                        options.push('-d');
                        options.push(resource.Name);
                    }
                });
                options.push('-e');

                var sqlcli = new SqlCli();                
                log.json(options);
                sqlcli.run(options);
            });
        });
};