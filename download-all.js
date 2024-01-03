const lineReader = require('line-reader');
const { FFMpegProgress } = require('ffmpeg-progress-wrapper');
const uploader = require('./src/upload')
var path = require('path');
var ytdl = require('ytdl-core');
var fs = require('fs');
const _colors = require('colors');
const cliProgress = require('cli-progress');
const { downloadMp4, getMp3Path, getMp4Path } = require('./src/downloader/downloader');
const { convertMp4ToMp3 } = require('./src/converter/converter');

const multiBar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: '# {task} | {bar} | {percentage}%   {filename}',
}, cliProgress.Presets.shades_classic);

let skipUpload = true
let progressBarCount = 0
lineReader.eachLine('song-list', function(line) {
    let components = line.split('\t')
    let link = components[0]
    let fileName = components[1]
    let pathMp3 = getMp3Path(fileName)
    let pathMp4 = getMp4Path(fileName)  // Will auto detect .mp3 extension and convert to .mp4 also
    

    progressBarCount++
    const progressBar = multiBar.create(100, 0, {filename: fileName, task: _colors.white("Downloading".padEnd(21, ' '))})

    downloadMp4(link, pathMp4, progressBar, () => {

        progressBar && progressBar.update(0, {task: _colors.cyan("Converting MP4 -> MP3".padEnd(21, ' '))})
        progressBar && progressBar.setTotal(0.001)

        convertMp4ToMp3(pathMp4, pathMp3, skipUpload, progressBar, (increment) => {
            progressBarCount += increment
            if (progressBarCount == 0) {
                multiBar.stop()
            }
        })
    })
});
