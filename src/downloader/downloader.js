var path = require('path');
const appConstants = require('../../config/constants');
const ytdl = require('ytdl-core');
var fs = require('fs');

function downloadMp4(link, pathMp4, progressBar, onDone) {
    var url = link;
    var output = pathMp4 // path.resolve(appConstants.projectRoot, "mp4/"+fileName);

    // Filter 'highestaudio' or 'audioonly' might result in .webm format is downloaded
    // instead of .mp4, which in turn will cause ffmpeg progress to report wrongly and
    // ultimately destroy our beautiful progress bar

    let _resolve, _reject
    const promise = new Promise((resolve, reject) => {
        _resolve = resolve
        _reject = reject
    })

    try {
        var video = ytdl(url, { filter: 'audio', /* quality: 'highestaudio' */});
        video.pipe(fs.createWriteStream(output, {flags: "w"}));
        video.on('response', function(res) {
            var totalSize = res.headers['content-length'];
    
            progressBar && progressBar.setTotal(totalSize)
    
            var dataRead = 0;
            res.on('data', function(data) {
                dataRead += data.length;
                progressBar && progressBar.update(dataRead)
            });
            res.on('end', function() {
                video._destroy()
                setTimeout(() => {
                    onDone && onDone()
                    _resolve()
                }, 200);
            });
        })
    }
    catch (e) {
        console.log(e)
    }
    return promise  
}

function getMp3Path(fileName) {
    if (fileName.indexOf('.mp3') == -1) {
        fileName += ".mp3"
    }
    let pathMp3 = path.join(appConstants.projectRoot, 'mp3', fileName)
    return pathMp3
}

function getMp4Path(fileName) {
    fileName = fileName.replace('.mp3', '.mp4')
    if (fileName.indexOf('.mp4') == -1) {
        fileName += ".mp4"
    }
    let pathMp4 = path.join(appConstants.projectRoot, 'mp4Video', fileName)
    return pathMp4
}

module.exports = {
    downloadMp4,
    getMp3Path,
    getMp4Path,
}