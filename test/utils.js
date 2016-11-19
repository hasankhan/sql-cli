(function () {
    "use strict";

    class Utils {
        // removes the module from require cache
        static unloadModule(name) {
            // convert name into regex if it is not
            if (!(name instanceof RegExp)) {
                name = new RegExp(name.toString());
            }

            Object.keys(require.cache)
                .forEach(key => {
                    // if module has name in it then remove it
                    if (name.test(key)) {
                        delete require.cache[key];
                    }
                });
        }

        // normalizes and compares two strings for equality
        static stringEqual(first, second) {
            var pattern = /[\s\r\n\t]/g;
            var normalizedFirst = first.replace(pattern, '');
            var normalizedSecond = second.replace(pattern, '');
            expect(normalizedFirst).toEqual(normalizedSecond);
        }
    }

    module.exports = exports = Utils;

} ());