const lineReader = require('line-reader');
const { FFMpegProgress } = require('ffmpeg-progress-wrapper');
const uploader = require('./src/upload')
var path = require('path');
var ytdl = require('ytdl-core');
var fs = require('fs');
const _colors = require('colors');
const cliProgress = require('cli-progress');

const multiBar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: '# {task} | {bar} | {percentage}%   {filename}',
}, cliProgress.Presets.shades_classic);

let progressBarCount = 0
lineReader.eachLine('song-list', function(line) {
    let components = line.split('\t')
    let link = components[0]
    let fileName = components[1]

    let fileNameMp4 = fileName.replace('.mp3', '.mp4')
    let pathMp4 = `mp4/${fileNameMp4}`

    progressBarCount++
    const progressBar = multiBar.create(100, 0, {filename: fileName, task: _colors.white("Downloading".padEnd(21, ' '))})

    downloadMp4(link, fileNameMp4, progressBar, () => {

        progressBar && progressBar.update(0, {task: _colors.cyan("Converting MP4 -> MP3".padEnd(21, ' '))})
        progressBar && progressBar.setTotal(0.001)

        const process = new FFMpegProgress(['-i', `mp4/${fileNameMp4}`, '-b:a', '192K', '-vn', '-y', `mp3/${fileName}`]);        
        process.on('progress', (progress) => {
            progressBar && progressBar.update(progress.progress)
        });

        let skipUpload = true
        process.once('end', () => {
            // Remove unwanted mp4
            fs.unlink(path.resolve(__dirname,pathMp4), () => {})

            progressBar.update(progressBar.totalSize, {filename: fileName, task: _colors.magenta("Uploading".padEnd(21, ' '))})

            if (!skipUpload) {
                uploader.upload(fileName, progressBar, () => {
                    progressBarCount--
                    progressBar.update(progressBar.totalSize, {filename: fileName, task: _colors.green("Completed".padEnd(21, ' '))});
                    progressBar.stop();
                    if (progressBarCount == 0) {
                        multiBar.stop()
                    }
                });    
            }
            else {
                progressBarCount--
                progressBar && progressBar.update(progressBar.totalSize, {filename: fileName, task: _colors.green("Completed".padEnd(21, ' '))});
                progressBar && progressBar.setTotal(1)
                progressBar && progressBar.update(1)
                if (progressBarCount == 0) {
                    multiBar.stop()
                }
            }
        });
    })
});

function downloadMp4(link, fileName, progressBar, onDone) {
    var url = link;
    var output = path.resolve(__dirname, "mp4/"+fileName);

    // Filter 'highestaudio' or 'audioonly' might result in .webm format is downloaded
    // instead of .mp4, which in turn will cause ffmpeg progress to report wrongly and
    // ultimately destroy our beautiful progress bar

    try {
        var video = ytdl(url, { filter: 'audio', /* quality: 'highestaudio' */});
        video.pipe(fs.createWriteStream(output));
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
                    onDone()
                }, 200);
            });
        })
    }
    catch (e) {
        console.log(e)
    }
    
}