var SqlCli = require('../lib/cli');

var argv = process.argv.splice(0);
if (argv.length == 2) {
    argv = ['', '', '-h']
}
var cli = new SqlCli();
cli.run(argv);