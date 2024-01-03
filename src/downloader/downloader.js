var path = require('path');
const appConstants = require('../../config/constants');
const ytdl = require('ytdl-core');
var fs = require('fs');
const { exec } = require("child_process");

const shellDownloadMp3 = (url, mp3Name) => {
    return new Promise((resolve, reject) => {
        const npxPath = "/home/pi/.nvm/versions/node/v14.17.0/bin/npx"
        const command = `${npxPath} ytdl --filter audio --quality highestaudio "${url}" | ffmpeg -i pipe:0 -b:a 192K -vn -y "${mp3Name}"`
        console.log("Download command:", command)
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                reject(error)
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                resolve();
                return;
            }
            resolve()
            console.log(`stdout: ${stdout}`);
        });
    })
}

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
        // console.log("Starting download")
        // console.log("Start", process.memoryUsage())
        var video = ytdl(url, { filter: 'audio', /* quality: 'highestaudio' */});
        video.pipe(fs.createWriteStream(output, {flags: "w"}));
        video.on('response', function(res) {
            var totalSize = res.headers['content-length'];

            progressBar && progressBar.setTotal(totalSize)
            // console.log("TotalSize: " + totalSize)

            var dataRead = 0;
            res.on('data', function(data) {
                dataRead += data.length;
                progressBar && progressBar.update(dataRead)
                // console.log("Progress", process.memoryUsage())
                // console.log("DataRead: " + dataRead)
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
    shellDownloadMp3,
    getMp3Path,
    getMp4Path,
}