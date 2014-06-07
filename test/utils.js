(function (utils) {
    // removes the module from require cache
    utils.unloadModule = function(name) {
        // convert name into regex if it is not
        if (!(name instanceof RegExp)) {
            name = new RegExp(name.toString());
        }

        Object.keys(require.cache)
              .forEach(function(key) {
                // if module has name in it then remove it
                if (name.test(key)) {
                    delete require.cache[key];
                }
              });
    };
})(module.exports = {});