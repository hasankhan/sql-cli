## sql-cli

Cross platform command line interface for SQL Server

**NOTE: All Pull-Requests must be made into the `dev` branch.**

[![Build Status](https://travis-ci.org/hasankhan/sql-cli.svg)](https://travis-ci.org/hasankhan/sql-cli)

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

To get the list of all parameters type 'mssql -h'
```bash
Usage: mssql [options]

Options:

  -h, --help                     output usage information
  -V, --version                  output the version number
  -s, --server <server>          Server to connect to
  -u, --user <user>              User name to use for authentication
  -p, --pass <pass>              Password to use for authentication
  -o, --port <port>              Port to connect to
  -t, --timeout <timeout>        Connection timeout in ms
  -d, --database <database>      Database to connect to
  -q, --query <query>            The query to execute
  -v, --tdsVersion <tdsVersion>  Version of tds protocol to use [7_4, 7_2, 7_3_A, 7_3_B, 7_4]
  -e, --encrypt                  Enable encryption
  -f, --format <format>          The format of output [table, csv, xml, json]
  -c, --config <path>            Read connection information from config file
```
To connect to a SQL Server instance in Azure invoke mssql as follows
```bash
mssql -s abcdef.database.windows.net -u username@abcdef -p thepassword -d mydatabase -e
```

You will get a prompt as follows:
```bash
Connecting to abcdef.database.windows.net...done

sql-cli version 0.1.0
Enter ".help" for usage hints.
mssql>
```
To get the list of all commands use the '.help' command
```bash
mssql> .help
.help               Shows this message                              
.databases          Lists all the databases                         
.tables             Lists all the tables                            
.sprocs             Lists all the stored procedures                 
.search TYPE VALUE  Searches for a value of specific type (col|text)
.indexes TABLE      Lists all the indexes of a table                
.read FILENAME      Execute commands in a file                      
.run FILENAME       Execute the file as a sql script                
.schema TABLE       Shows the schema of a table                     
.analyze            Analyzes the database for missing indexes.      
.quit               Exit the cli
```

To get the list of databases use the '.databases' command
```bash
mssql> .databases
name
------------------
master
test

2 row(s) returned in 12 ms
```

To get the list of tables use the '.tables' command
```bash
mssql> use test;
OK
mssql> .tables
database  schema  name   type
--------  ------  -----  ----------
test      dbo     books  BASE TABLE
test      dbo     test   BASE TABLE

2 row(s) returned in 24 ms
```

To find all tables with a specified column name
```bash
mssql> .search col ID
Searching...
table_name                  schema_name  column_name     
--------------------------  -----------  ----------------
Customers                   dbo          ID     
Products                    dbo          ID
2 row(s) returned

Executed in 1 ms
```

To find all records in a database with a value
```bash
mssql> .search text john
Searching...
ColumnName                  ColumnValue    
--------------------------  -----------
[dbo].[Customers].[Name]    John             
[dbo].[Books].[Author]      John        
2 row(s) returned

Executed in 1 ms
```

To exit the cli use the '.quit' command
```bash
mssql> .quit
```
