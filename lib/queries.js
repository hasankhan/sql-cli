var _ = require('underscore');

var Queries = (function () {

    var Queries = { };

    var queries = {
        getSchemaSql: "SELECT column_name, column_default, is_nullable, data_type type FROM information_schema.columns WHERE table_name = '%s'",
        listDatabasesSql: "SELECT name FROM sys.databases",
        listTablesSql: "SELECT table_catalog [database], table_schema [schema], table_name name, table_type type FROM information_schema.tables",
        listIndexesSql: "SELECT c.name, i.type_desc type, is_unique [unique], is_primary_key [primary]" +
                         "FROM sys.indexes i " + 
                         "JOIN sys.index_columns ic ON i.index_id=ic.index_id AND i.object_id=ic.object_id " + 
                         "JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id " + 
                         "WHERE i.object_id=object_id('%s')"
    };

    _.each(queries, function(sql, name) {
        Object.defineProperty(Queries, name, {
            get: function () { return sql; }
        });
    });

    return Queries;
})();

module.exports = exports = Queries;