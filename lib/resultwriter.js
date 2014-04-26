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
    else if (format == 'xml') {
        return new XmlWriter();
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

var XmlWriter = (function () {
    function XmlWriter() {
    }

    XmlWriter.prototype.write = function (result) {
        var self = this;

        console.log('<?xml version="1.0" encoding="UTF-8"?>');
        console.log('<result>');
        result = result || [];

        result.forEach(function(item) {
            formatItem(item);

            console.log('    <row>');
            _.each(item, function(value, key) {
                value = self._escape(value);
                key = self._escape(key);
                console.log(_.sprintf('        <%s>%s</%s>', key, value, key));
            });
            console.log('    </row>');
        });

        console.log('</result>');
    };

    XmlWriter.prototype._escape = function(text) {
        if (typeof text !== 'string') {
            return text;
        }

        return text.replace('"', '&quot;')
                    .replace("'", '&apos;')
                    .replace('<', '&lt;')
                    .replace('>', '&gt;')
                    .replace('&', '&amp;');
    };

    return XmlWriter;
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
