(function () {
    "use strict";

    var _ = require('underscore'),
        _str = require('underscore.string'),
        Table = require('easy-table'),
        csv = require('ya-csv'),
        sprintf = require("sprintf-js").sprintf;

    _.mixin(_str.exports());

    class TableWriter {
        constructor() {
            // avoid printing extra blank line after result
            this.appendsLineToResult = true;
        }

        start() {
            this.firstLine = true;
        }

        write(result) {
            if (!result || result.length === 0) {
                console.log();
                return;
            }

            if (!this.firstLine) {
                console.log();
            }

            result.forEach(formatItem);
            console.log(Table.print(result));

            this.firstLine = false;
        }

        end() {
        }
    }

    class JsonWriter {
        constructor() {
        }

        start() {
            this.firstLine = true;
        }

        write(result) {
            result = result || [];

            var prefix = !this.firstLine ? ', ' : '';
            console.log(prefix + JSON.stringify(result, null, 4));
            this.firstLine = false;
        }

        end() {

        }
    }

    class XmlWriter {
        constructor() {
        }

        start() {
            console.log('<?xml version="1.0"?>');
            console.log('<results>');
        }

        write(result) {
            var self = this;

            result = result || [];

            console.log('   <result>');

            result.forEach(function (item) {
                formatItem(item);

                console.log('       <row>');
                Object.keys(item)
                    .forEach(function (key) {
                        var value = self._escape(item[key]);
                        key = self._escape(key);
                        console.log(sprintf('         <%s>%s</%1$s>', key, value));
                    });
                console.log('       </row>');
            });

            console.log('   </result>');
        }

        end() {
            console.log('</results>');
        }

        _escape(text) {
            if (typeof text !== 'string') {
                return text;
            }

            return text.replace('"', '&quot;')
                .replace("'", '&apos;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('&', '&amp;');
        }
    }

    class CsvWriter {
        constructor() {
            this.writer = csv.createCsvStreamWriter(process.stdout);
        }

        start() {
            this.firstLine = true;
        }

        write(result) {
            var self = this;

            if (!result || result.length === 0) {
                return;
            }

            if (!this.firstLine) {
                console.log();
            }

            result.forEach(function (item, i) {
                // if it is first row then write column names
                if (i === 0) {
                    self.writer.writeRecord(_.keys(item));
                }

                formatItem(item);

                self.writer.writeRecord(_.values(item));
            });

            this.firstLine = false;
        }

        end() {
        }
    }

    function formatItem(item) {
        _.each(item, function (value, key) {
            if (value instanceof Date) {
                item[key] = value.toISOString();
            } else if (value instanceof Buffer) {
                item[key] = value.toString('hex');
            }
        });
    }

    class ResultWriter {
        static create(format) {
            if (!format || format == 't' || format == 'table') {
                return new TableWriter();
            }
            else if (format == 'c' || format == 'csv') {
                return new CsvWriter();
            }
            else if (format == 'x' || format == 'xml') {
                return new XmlWriter();
            }
            else if (format == 'j' || format == 'json') {
                return new JsonWriter();
            }
            else {
                throw new Error(sprintf("Format '%s' is not supported.", format));
            }
        }
    }

    ResultWriter.XmlWriter = XmlWriter;
    ResultWriter.JsonWriter = JsonWriter;
    ResultWriter.TableWriter = TableWriter;
    ResultWriter.CsvWriter = CsvWriter;

    module.exports = exports = ResultWriter;
} ());