var _ = require('underscore'),
    M = require('mstring');

var Queries = (function () {

    var Queries = { };

    var queries = {
        getSchemaSql: M(function(){/***
              SELECT column_name name, column_default [default], is_nullable nullable, data_type type, 
                       col_length(object_schema_name(object_id('%1$s')) + '.' + object_name(object_id('%1$s')), column_name) length, 
                       (SELECT CASE WHEN count(1) > 0 THEN 'YES' ELSE 'NO' END 
                              FROM sys.index_columns ic 
                              WHERE ic.object_id = object_id('%1$s') AND 
                                    ic.column_id=columnproperty(object_id('%1$s'), column_name, 'columnid') AND 
                                    ic.key_ordinal = 1) indexed 
               FROM information_schema.columns 
               WHERE table_name = object_name(object_id('%1$s')) AND 
                      table_schema = object_schema_name(object_id('%1$s'))
               ORDER BY ordinal_position;
        ***/}),
                       
        listDatabasesSql: M(function(){/***
            SELECT name FROM sys.databases;
        ***/}),
        
        listTablesSql: M(function(){/***
            SELECT table_catalog [database], table_schema [schema], table_name name, table_type type 
            FROM information_schema.tables;
        ***/}),
        
        listIndexesSql: M(function(){/***
            SELECT i.name, i.type_desc type, is_unique [unique], is_primary_key [primary], 
                   STUFF((SELECT ', ' + c.name
                            FROM sys.index_columns ic
                            JOIN sys.columns c ON ic.column_id = c.column_id AND ic.object_id = c.object_id
                            WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
                            ORDER BY ic.key_ordinal
                            FOR XML PATH('')), 1, 1, '') columns
             FROM sys.indexes i 
             WHERE i.object_id=object_id('%s');
        ***/})
    };

    // expose a read-only property for each query
    _.each(queries, function(sql, name) {
        Object.defineProperty(Queries, name, {
            get: function () { return sql; }
        });
    });

    return Queries;
})();

module.exports = exports = Queries;