(function () {
	"use strict";

	var _ = require('underscore'),
		mstring = require('mstring'),
		sprintf = require("sprintf-js").sprintf;

	class Queries {
		static getSchemaSql(table) {
			return sprintf(mstring(function () {/***
				  SELECT COLUMN_NAME name, 
					COLUMN_DEFAULT [default], 
					IS_NULLABLE nullable, 
					DATA_TYPE type, 
					COL_LENGTH(OBJECT_SCHEMA_NAME(OBJECT_ID('%1$s')) + '.' + OBJECT_NAME(OBJECT_ID('%1$s')), COLUMN_NAME) length, 
					(SELECT CASE WHEN count(1) > 0 THEN 'YES' ELSE 'NO' END 
						FROM sys.index_columns ic 
						WHERE ic.object_id = OBJECT_ID('%1$s') AND 
							ic.column_id=COLUMNPROPERTY(OBJECT_ID('%1$s'), COLUMN_NAME, 'ColumnId') AND 
							ic.key_ordinal = 1) indexed 
				   FROM INFORMATION_SCHEMA.COLUMNS 
				   WHERE TABLE_NAME = OBJECT_NAME(OBJECT_ID('%1$s')) AND 
						  TABLE_SCHEMA = OBJECT_SCHEMA_NAME(OBJECT_ID('%1$s'))
				   ORDER BY ORDINAL_POSITION;
			***/}), table);
		}

		static listDatabasesSql() {
			return mstring(function () {/***
				SELECT name FROM sys.databases;
			***/});
		}

		static listTablesSql() {
			return mstring(function () {/***
				SELECT TABLE_CATALOG [database], 
					TABLE_SCHEMA [schema], 
					TABLE_NAME name, 
					TABLE_TYPE type 
				FROM INFORMATION_SCHEMA.TABLES;
			***/});
		}

		static listIndexesSql(table) {
			return sprintf(mstring(function () {/***
				SELECT i.name, 
					i.type_desc type, 
					is_unique [unique], 
					is_primary_key [primary], 
					STUFF((SELECT ', ' + c.name
							FROM sys.index_columns ic
							JOIN sys.columns c ON ic.column_id = c.column_id AND ic.object_id = c.object_id
							WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
							ORDER BY ic.key_ordinal
							FOR XML PATH('')), 1, 1, '') columns
				 FROM sys.indexes i 
				 WHERE i.object_id=OBJECT_ID('%s');
			***/}), table);
		}

		static listMissingIndexesSql(table) {
			return sprintf(mstring(function () {/***
				SELECT
					DB_NAME(mid.database_id) [database],
					OBJECT_SCHEMA_NAME(mid.[OBJECT_ID]) [schema],
					OBJECT_NAME(mid.[OBJECT_ID]) [table],
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
	}

	module.exports = exports = Queries;

} ()); 