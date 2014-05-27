(function (utils) {
    utils.unloadModule = function(name) {
        Object.keys(require.cache)
              .forEach(function(key) {
                if (key.indexOf(name) >= 0) {
                    delete require.cache[key];
                }
              });
    };
})(module.exports = {});