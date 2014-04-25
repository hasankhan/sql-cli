var _ = require('underscore'),
    _str = require('underscore.string'),
    Table = require('easy-table'),
    csv = require('ya-csv');

_.mixin(_str.exports());
    
function create(format) {
    if (!format || format == 'table') {
        return new TableWriter();
    }
    else if (format == 'csv') {
        return new CsvWriter();
    }
    else {
        throw new Error(_.sprintf("Format '%s' is not supported.", format));
    } 
}
    
var TableWriter = (function () {
    function TableWriter() {
    }
    
    TableWriter.prototype.write = function (result) {
        if (!result || result.length == 0) {
            console.log();
            return;
        }
        
        result.forEach(formatItem);        
        console.log(Table.printArray(result));
    };
    return TableWriter;
})();

var CsvWriter = (function () {
    function CsvWriter() {
        this.writer = csv.createCsvStreamWriter(process.stdout);
    }
    
    CsvWriter.prototype.write = function (result) {
        var self = this;
        
        if (!result || result.length == 0) {
            return;
        }        

        result.forEach(function (item, i) {
            // if it is first row then write column names 
            if (i == 0) {
                self.writer.writeRecord(_.keys(item));
            }
            
            formatItem(item);            
        
            self.writer.writeRecord(_.values(item));
        });
    };
    return CsvWriter;
})();

function formatItem(item) {
    _.each(item, function (value, key) {
        if (value instanceof Date) {
            item[key] = value.toISOString();
        } else if (value instanceof Buffer) {
            item[key] = value.toString('hex');
        }
    });
}

exports.TableWriter = TableWriter;
exports.CsvWriter = CsvWriter;
exports.create = create;
