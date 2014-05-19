var SqlCli = require('../lib/cli');

var argv = process.argv.splice(0);
var cli = new SqlCli();
cli.run(argv, process.env);