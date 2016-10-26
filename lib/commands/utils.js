(function () {
    "use strict";
    
    var readline = require('readline'),
    iconv = require('iconv-lite'),
    chardet = require('chardet'),
    fs = require('fs'),
    _str = require('underscore.string');

    class Utils {
        static runQuery(messages, writer, query) {
            var start = new Date().getTime();
            return query().then(function (recordsets) {
                var elapsed = new Date().getTime() - start;
                writer.start();
                recordsets.forEach(function (recordset) {
                    if (!recordset) {
                        messages.done();
                    }
                    else {
                        writer.write(recordset);
                        if (writer.freeFormat) {
                            messages.rowCount(recordset.length, writer.appendsLineToResult);
                        }
                    }
                });
                writer.end();
                messages.resultsetsEnd(recordsets.length, elapsed);
            });
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