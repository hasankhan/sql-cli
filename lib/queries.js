var _ = require('underscore'),
	_str = require('underscore.string'),
    M = require('mstring');

_.mixin(_str.exports());

var Queries = (function () {

    var Queries = {
        getSchemaSql: function(table) {		
			return _.sprintf(M(function(){/***
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
			***/}), table);
		},
                       
        listDatabasesSql: function(){
			return M(function(){/***
				SELECT name FROM sys.databases;
			***/});
		},
        
        listTablesSql: function(){
			return M(function(){/***
				SELECT table_catalog [database], table_schema [schema], table_name name, table_type type 
				FROM information_schema.tables;
			***/});
		},
        
        listIndexesSql: function (table) {
			return _.sprintf(M(function(){/***
				SELECT i.name, i.type_desc type, is_unique [unique], is_primary_key [primary], 
					   STUFF((SELECT ', ' + c.name
								FROM sys.index_columns ic
								JOIN sys.columns c ON ic.column_id = c.column_id AND ic.object_id = c.object_id
								WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
								ORDER BY ic.key_ordinal
								FOR XML PATH('')), 1, 1, '') columns
				 FROM sys.indexes i 
				 WHERE i.object_id=object_id('%s');
			***/}), table); 
		},
        
        listMissingIndexesSql:  function (table) {
			return _.sprintf(M(function(){/***
				SELECT
					DB_NAME(mid.database_id) [database],
					OBJECT_SCHEMA_NAME(mid.[object_id]) [schema],
					OBJECT_NAME(mid.[object_id]) [table],
					migs.avg_total_user_cost * (migs.avg_user_impact / 100.0) * (migs.user_seeks + migs.user_scans) AS improvement_measure,
					mid.equality_columns,
					mid.inequality_columns, 
					mid.included_columns,
					unique_compiles,
					user_seeks,
					user_scans,
					avg_total_user_cost,
					avg_user_impact,
					system_seeks,
					system_scans,
					avg_total_system_cost,
					avg_system_impact
				FROM sys.dm_db_missing_index_groups mig
				INNER JOIN sys.dm_db_missing_index_group_stats migs ON migs.group_handle = mig.index_group_handle
				INNER JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
				WHERE migs.avg_total_user_cost * (migs.avg_user_impact / 100.0) * (migs.user_seeks + migs.user_scans) > 10
				ORDER BY migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) DESC
			***/}), table);
		}
    };    

    return Queries;
})();

module.exports = exports = Queries;