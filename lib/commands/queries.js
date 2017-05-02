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
					(DATA_TYPE + (CASE WHEN CHARINDEX('char', DATA_TYPE) = 0 THEN '' ELSE '(' + CAST(CHARACTER_MAXIMUM_LENGTH as VARCHAR(16)) + ')' END)) type,
					COL_LENGTH(OBJECT_SCHEMA_NAME(OBJECT_ID('%1$s')) + '.' + OBJECT_NAME(OBJECT_ID('%1$s')), COLUMN_NAME) length,
					(SELECT CASE WHEN count(1) > 0 THEN 'YES' ELSE 'NO' END
						FROM sys.index_columns ic
						WHERE ic.object_id = OBJECT_ID('%1$s') AND
							ic.column_id=COLUMNPROPERTY(OBJECT_ID('%1$s'), COLUMN_NAME, 'ColumnId') AND
							ic.key_ordinal = 1) indexed
				   FROM INFORMATION_SCHEMA.COLUMNS
				   WHERE TABLE_NAME = OBJECT_NAME(OBJECT_ID('%1$s')) AND
						  TABLE_SCHEMA = OBJECT_SCHEMA_NAME(OBJECT_ID('%1$s'))
				   ORDER BY name;
			***/}), table);
		}

		static listDatabasesSql() {
			return mstring(function () {/***
				SELECT name FROM sys.databases
				ORDER BY name;
			***/});
		}

		static listTablesSql() {
			return mstring(function () {/***
				SELECT TABLE_CATALOG [database],
					TABLE_SCHEMA [schema],
					TABLE_NAME name,
					TABLE_TYPE type
				FROM INFORMATION_SCHEMA.TABLES
				ORDER BY name;
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
				 WHERE i.object_id=OBJECT_ID('%s')
				 ORDER BY i.name;
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

		static listSprocsSql() {
			return mstring(function () {/***
				SELECT
					SPECIFIC_CATALOG [database],
					SPECIFIC_SCHEMA [schema],
					SPECIFIC_NAME name,
					ROUTINE_TYPE type
				FROM INFORMATION_SCHEMA.ROUTINES
				WHERE ROUTINE_TYPE = 'PROCEDURE'
				ORDER BY SPECIFIC_NAME;
			***/});
		}

		static searchSql(search) {
			return sprintf(mstring(function () {/***
				DECLARE @SearchStr nvarchar(100)
				SET @SearchStr = '%s'

				CREATE TABLE #Results (ColumnName nvarchar(370), ColumnValue nvarchar(3630))

				SET NOCOUNT ON

				DECLARE @TableName nvarchar(256), @ColumnName nvarchar(128), @SearchStr2 nvarchar(110)
				SET  @TableName = ''
				SET @SearchStr2 = QUOTENAME('%%' + @SearchStr + '%%','''')

				WHILE @TableName IS NOT NULL

				BEGIN
				    SET @ColumnName = ''
				    SET @TableName =
				    (
				        SELECT MIN(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME))
				        FROM     INFORMATION_SCHEMA.TABLES
				        WHERE         TABLE_TYPE = 'BASE TABLE'
				            AND    QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) > @TableName
				            AND    OBJECTPROPERTY(
				                    OBJECT_ID(
				                        QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME)
				                         ), 'IsMSShipped'
				                           ) = 0
				    )

				    WHILE (@TableName IS NOT NULL) AND (@ColumnName IS NOT NULL)

				    BEGIN
				        SET @ColumnName =
				        (
				            SELECT MIN(QUOTENAME(COLUMN_NAME))
				            FROM     INFORMATION_SCHEMA.COLUMNS
				            WHERE         TABLE_SCHEMA    = PARSENAME(@TableName, 2)
				                AND    TABLE_NAME    = PARSENAME(@TableName, 1)
				                AND    DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar', 'int', 'decimal')
				                AND    QUOTENAME(COLUMN_NAME) > @ColumnName
				        )

				        IF @ColumnName IS NOT NULL

				        BEGIN
				            INSERT INTO #Results
				            EXEC
				            (
				                'SELECT ''' + @TableName + '.' + @ColumnName + ''', LEFT(' + @ColumnName + ', 150) FROM ' + @TableName + ' (NOLOCK) ' +
				                ' WHERE ' + @ColumnName + ' LIKE ' + @SearchStr2
				            )
				        END
				    END
				END

				SELECT ColumnName, ColumnValue FROM #Results

				DROP TABLE #Results

			***/}), search);
		}
		static getColumnsSql(column) {
			return sprintf(mstring(function () {/***
				SELECT t.name AS table_name,
				SCHEMA_NAME(schema_id) AS schema_name,
				c.name AS column_name
				FROM sys.tables AS t
				INNER JOIN sys.columns c ON t.OBJECT_ID = c.OBJECT_ID
				WHERE c.name LIKE '%%' + '%s' + '%%'
				ORDER BY schema_name, table_name;
			***/}), column);
		}

	}

	module.exports = exports = Queries;

} ());
