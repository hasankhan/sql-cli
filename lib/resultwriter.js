(function () {
    "use strict";

    var _ = require('underscore'),
        _str = require('underscore.string'),
        Table = require('easy-table'),
        csv = require('ya-csv'),
        sprintf = require("sprintf-js").sprintf;

    _.mixin(_str.exports());

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

        constructor() {
        }

        startResult() {
            this.firstSet = true;
        }

        startSet() {
        }

        writeRows() {
        }

        endSet() {
            this.firstSet = false;
        }

        endResult() {
        }

        formatItem(item) {
            _.each(item, (value, key) => {
                if (value instanceof Date) {
                    item[key] = value.toISOString();
                } else if (value instanceof Buffer) {
                    item[key] = value.toString('hex');
                }
            });
        }

        log(output) {
            if (output === undefined) {
                output = '';
            }
            console.log(output);
        }
    }

    class TableWriter extends ResultWriter {
        constructor() {
            super();

            // avoid printing extra blank line after result
            this.appendsLineToResult = true;

            // can afford extra information between resultsets
            this.freeFormat = true;
        }

        startSet() {
            super.startSet();
            
            if (!this.firstSet) {
                this.log();
            }
        }

        writeRows(result) {
            result.forEach(this.formatItem.bind(this));
            this.log(Table.print(result));
        }
    }

    class JsonWriter extends ResultWriter {
        constructor() {
            super();
        }

        startResult() {
            super.startResult();

            this.log('[');
        }

        startSet() {
            super.startSet();

            if (this.firstSet) {
                this.log('[');
            }
            else {
                this.log(',[');
            }

            this.firstRow = true;
        }

        writeRows(result) {
            var prefix = this.firstRow ? '' : ',';
            this.log(prefix + '[');
            prefix = '';
            result.forEach(item => {
                this.log(prefix + JSON.stringify(item, true, 4));
                prefix = ',';
            });
            this.log(']');
        }

        endSet() {
            super.endSet();

            this.log(']');
        }

        endResult() {
            super.endResult();

            this.log(']');
        }
    }

    class XmlWriter extends ResultWriter {
        constructor() {
            super();
        }

        startResult() {
            super.startResult();

            this.log('<?xml version="1.0"?>');
            this.log('<results>');
        }

        startSet() {
            super.startSet();

            this.log('   <result>');
        }

        writeRows(result) {
            result = result || [];
            result.forEach(item => {
                this.formatItem(item);

                this.log('       <row>');
                Object.keys(item)
                    .forEach(key => {
                        var value = this._escape(item[key]);
                        key = this._escape(key);
                        this.log(sprintf('         <%s>%s</%1$s>', key, value));
                    });
                this.log('       </row>');
            });
        }

        endSet() {
            super.endSet();

            this.log('   </result>');
        }

        endResult() {
            super.endResult();

            this.log('</results>');
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

    class CsvWriter extends ResultWriter {
        constructor() {
            super();

            this.writer = csv.createCsvStreamWriter(process.stdout);
        }

        startSet() {
            super.startSet();
            
            if (!this.firstSet) {
                this.log();
            }
            this.firstRow = true;
        }

        writeRows(result) {
            result = result || [];
            result.forEach((item, i) => {
                // if it is first row then write column names
                if (this.firstRow) {
                    this.writer.writeRecord(_.keys(item));
                    this.firstRow = false;
                }

                this.formatItem(item);

                this.writer.writeRecord(_.values(item));
            });
        }
    }

    ResultWriter.XmlWriter = XmlWriter;
    ResultWriter.JsonWriter = JsonWriter;
    ResultWriter.TableWriter = TableWriter;
    ResultWriter.CsvWriter = CsvWriter;

    module.exports = exports = ResultWriter;
} ());