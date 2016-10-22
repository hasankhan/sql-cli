(function () {
    "use strict";

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
                        messages.rowCount(recordset.length, writer.appendsLineToResult);
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
    }

    module.exports = exports = Utils;

} ());