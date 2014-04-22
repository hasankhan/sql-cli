var _ = require('underscore'),
    _str = require('underscore.string'),
	Q = require('q'),
	mssql = require('mssql'),
	Queries = require('./queries');

var DbService = (function () {

	var DbService = function() {
	}
	
	DbService.prototype.connect = function(config) {
		return Q.nfcall(mssql.connect.bind(mssql), config);
	};

	DbService.prototype.query = function(cmd, args) {
        var self = this;

        args = args || [];
        args.unshift(cmd);
        var sql = _.sprintf.apply(null, args);

        var request = new mssql.Request();        		
        return Q.nfcall(request.query.bind(request), sql);
    };	
	
	DbService.prototype.listTables = function() {
        return this.query(Queries.listTablesSql);
    };

    DbService.prototype.listDatabases = function() {
        return this.query(Queries.listDatabasesSql);
    };
	
	DbService.prototype.getSchema = function(fullName) {
		var sql = Queries.getSchemaSql;
		
		var tableName = fullName;
        var i = fullName.indexOf('.');
        var params = [fullName];
        if (i > -1) {
            tableName = fullName.substring(i+1);
            var schema = fullName.substring(0, i);
            params = [tableName, schema];
            sql += " AND TABLE_SCHEMA = '%s'";
        }

        sql += ' ORDER BY ORDINAL_POSITION';
		
		return this.query(sql, params);
	};
	
	return DbService;
})();

module.exports = exports = DbService;