var Client = require('ftp');
var fs = require('fs');
const cliProgress = require('cli-progress');

var uploader = {
    upload: function(fileName, progressBar, onDone) {
        const path = process.cwd() + "/downloaded/" + fileName

        var stats = fs.statSync(path)
    
        let uploadfile = fs.createReadStream(path);
        let uploadedSize = 0
    
        let bar1 = progressBar || new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

        bar1.setTotal(stats.size)
        var c = new Client();
        c.on('ready', function() {
            uploadfile.on('data', function(buffer) {
                var segmentLength = buffer.length;
                uploadedSize += segmentLength;
                bar1.update(uploadedSize)
            });
    
            c.put(uploadfile, fileName, function(err) {
                if (err) throw err;
                c.end();
                onDone && onDone()
            });
        });
    
        c.connect({
            host: "",
            user: "",
            password: "",
        });
    }
}

module.exports = uploader