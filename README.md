## sql-cli

Cross platform command line interface for SQL Server

## Installation

You can install the sql-cli npm package.
```bash
npm install -g sql-cli
```

If you're more adventurous and like to live on the edge then you can install development version as follows:
```bash
git clone https://github.com/hasankhan/sql-cli
cd sql-cli
git checkout dev
npm install -g
```

## Get Started

To get list of all parameters type 'mssql -h'
```bash
Usage: mssql [options]

Options:

  -h, --help                     output usage information
  -V, --version                  output the version number
  -s, --server <server>          Server to conect to
  -u, --user <user>              User name to use for authentication
  -p, --pass <pass>              Password to use for authentication
  -o, --port <port>              Port to connect to
  -t, --timeout <timeout>        Connection timeout in ms
  -d, --database <database>      Database to connect to
  -q, --query <query>            The query to execute
  -v, --tdsVersion <tdsVersion>  Version of tds protocol to use
  -e, --encrypt                  Enable encryption
  -f, --format <format>          The format of output i.e. (csv, table)
```
To connect to a SQL Server instance in Azure invoke mssql as follows
```bash
mssql -s abcdef.database.windows.net -u username@abcdef -p thepassword -d mydatabase -e
```

You will get a prompt as follows:
```bash
Connecting to abcdef.database.windows.net...done

sql-cli version 0.0.9
Enter ".help" for usage hints.
mssql>
```

To get a list of databases use the '.databases' command
```bash
mssql> .databases
name
------------------
master
test

2 row(s) returned in 12 ms
```

To get a list of tables use the '.tables' command
```bash
mssql> use test;
OK
mssql> .tables
TABLE_CATALOG  TABLE_SCHEMA  TABLE_NAME          TABLE_TYPE
-------------  ------------  ------------------  ----------
test           dbo           Customers           BASE TABLE
test           dbo           Orders              BASE TABLE

2 row(s) returned in 24 ms
```

To exit the cli use the '.quit' command
```bash
mssql> .quit
```
## Integration with Azure CLI

This module also serves as an extension to Azure CLI tool that allows you to directly connect to database of your Mobile Service. 

To connect to your Mobile Service database you can use the 'connect' command as follows:
```bash
azure mobile sqldb connect <mobileservicename> <username> <password>
```

To run a query against your Mobile Service database you can use the 'query' command as follows:
```bash
azure mobile sqldb query <mobileservicename> <username> <password>
```
