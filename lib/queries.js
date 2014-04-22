var _ = require('underscore');

var Queries = (function () {

	var Queries = { };
	
	var queries = {
		getSchemaSql: "SELECT COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE, DATA_TYPE TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '%s'",
		listDatabasesSql: "SELECT name FROM sys.databases",
		listTablesSql: "SELECT * FROM INFORMATION_SCHEMA.TABLES"
	};
	
	_.each(queries, function(sql, name) {
		Object.defineProperty(Queries, name, {
			get: function () { return sql; }
		});
	});	
	
	return Queries;
})();

module.exports = exports = Queries;