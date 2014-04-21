var SqlCli = require('../lib/cli');

var argv = process.argv.splice(0);
// if no arguments were specified then show help
if (argv.length == 2) {
    argv = ['', '', '-h']
}
var cli = new SqlCli();
cli.run(argv);