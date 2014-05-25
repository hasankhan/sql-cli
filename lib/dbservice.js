var _ = require('underscore'),
    _str = require('underscore.string'),
    Q = require('q'),
    mssql = require('mssql');

_.mixin(_str.exports());

var DbService = (function () {

    var DbService = function() {
    };

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

    return DbService;
})();

module.exports = exports = DbService;