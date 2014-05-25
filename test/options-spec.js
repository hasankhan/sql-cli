var proxyquire =  require('proxyquire');

describe('Options', function() {
    var fs, path, options;
    
    beforeEach(function() {
        fs = {};
        path = {};
        var Options = proxyquire('../lib/options', { 
            fs: fs, 
            path: path 
        });
        options = new Options();
    });
    
    describe('init', function() {
        it('parses and copies args', function() {
            fs.existsSync = function() { return true; };
            
            options.init([
                'node.exe', 'test.js',
                '-s', 'localhost',
                '-u', 'sa',
                '-p', 'password',
                '-o', '1234',
                '-t', '5500',
                '-d', 'test',
                '-q', '.tables',
                '-v', '7_2',
                '-e', 
                '-f', 'xml',
                '-c', 'config.json'
            ], {});       
            
            expect(options.args).toEqual({
                'server': 'localhost',
                'user': 'sa',
                'pass': 'password',
                'port': '1234',
                'timeout': '5500',
                'database': 'test',
                'query': '.tables',            
                'tdsVersion': '7_2',
                'encrypt': true,
                'format': 'xml',
                'config': 'config.json'
            });
        });    
        
        it('throws if config does not exist', function() {
            fs.existsSync = function() { return false; };
            
            var args = [
                'node.exe', 'test.js',
                '-c', 'config.json'
            ];
            
            var err = new Error("config file 'config.json' does not exist.");
            expect(options.init.bind(options, args, {})).toThrow(err);               
        });
    });
});