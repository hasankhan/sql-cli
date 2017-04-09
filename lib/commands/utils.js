(function () {
    "use strict";

    var readline = require('readline'),
        Q = require('q'),
        iconv = require('iconv-lite'),
        chardet = require('chardet'),
        fs = require('fs'),
        _str = require('underscore.string');

    class Utils {
        static runQuery(messages, writer, query) {
            var start = new Date().getTime();
            var request = query();
            var deferred = Q.defer();
            var resultsets = 0;
            var rowCount = 0;
            var error = null;
            var rows = null;
            var rowsEmitted = false;            

            var startRecordset = () => {
                writer.startSet();
                rows = [];
                rowCount = 0;
                resultsets++;
            };

            var finishRecordset = () => {
                if (rows.length > 0) {
                    writer.writeRows(rows);
                }
                writer.endSet();

                if (writer.freeFormat) {
                    messages.rowCount(rowCount, writer.appendsLineToResult);
                }
            };

            request.on('recordset', recordset => {
                if (!rowsEmitted) {
                    rowsEmitted = true;
                    writer.startResult();
                }
                else {
                    finishRecordset();
                }
                startRecordset();
            });

            request.on('row', row => {
                rows.push(row);
                rowCount++;
                if (rows.length == messages.pageSize) {
                    writer.writeRows(rows);
                    rows = [];
                }
            });

            request.on('error', err => {
                error = err;
                deferred.reject(err);
            });

            request.on('done', returnValue => {
                if (!error) {
                    if (rowsEmitted === false) {
                        messages.done(); // show 'done' on console for non-queries
                    }
                    else {
                        finishRecordset(); // purge last result
                    }
                    var elapsed = new Date().getTime() - start;
                    writer.endResult(); // i.e. add closing tag of output xml
                    messages.resultsetsEnd(resultsets, elapsed); // show elapsed time on console     
                    deferred.resolve(resultsets);
                }
            });

            return deferred.promise;
        }

        static isContinued(line) {
            return line.substring(line.length - 1) == '\\';
        }

        static trimSlash(line) {
            if (!line) return;

            return line.substring(0, line.length - 1);
        }

        static appendLine(buffer, line) {
            if (buffer) {
                buffer += '\r\n';
            }
            buffer += line;
            return buffer;
        }

        static validateArgs(args, minCount) {
            return args && Array.isArray(args) && args.length >= minCount;
        }

        static detectEncoding(file) {
            var buffer = new Buffer(100);
            buffer.fill(0);
            var fd = fs.openSync(file, 'r');
            fs.readSync(fd, buffer, 0, 100);
            return chardet.detect(buffer);
        }

        static readFile(deferred, file) {
            var stream;

            file = file.trim();

            try {
                var encoding = Utils.detectEncoding(file);
                stream = fs.createReadStream(file)
                    .pipe(iconv.decodeStream(encoding));
            } catch (err) {
                deferred.reject(err);
                return null;
            }

            function onError(err) {
                deferred.reject(err);
            }
            stream.on('error', onError);

            var reader = new readline.createInterface({
                input: stream
            });
            reader.on('error', onError);

            return reader;
        }
    }

    module.exports = exports = Utils;

} ());