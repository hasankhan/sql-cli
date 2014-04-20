## sql-cli

Cross platform command line interface for SQL Server

## Installation

You can install the sql-cli npm package directly.
```bash
npm install -g sql-cli
```

## Get Started

To get list of all parameters type 'mssql -h'

```bash
  Usage: mssql [options]

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -s, --server [server]          Server to conect to
    -u, --user [user]              User name to use for authentication
    -p, --pass [pass]              Password to use for authentication
    -o, --port [port]              Port to connect to
    -t, --timeout [timeout]        Connection timeout in ms
    -d, --database [database]      Database to connect to
    -v, --tdsVersion [tdsVersion]  Version of tds protocol to use
    -e, --encrypt                  Enable encryption
```    
To connect to a sql server instance in sql azure invoke mssql as follows

```bash
  mssql -s abcdef.database.windows.net -u username@abcdef -p thepassword -d mydatabase -e
```
  
You will get a prompt as follows:
```bash
  Connecting abcdef.database.windows.net...done
  >
```

To get a list of databases use the '.databases' command
```bash
> .databases
name
------
master
mydb
```
  
To get a list of tables use the '.tables' command
```bash
> use mydb;
OK
> .tables
TABLE_CATALOG  TABLE_SCHEMA  TABLE_NAME                TABLE_TYPE
-------------  ------------  ------------------------  ----------
mydb           cstest2       TodoItems                 BASE TABLE
mydb           cstest2       test                      BASE TABLE
```
To exit the cli use the 'quit' command
```bash
  > quit
```
