const { FFMpegProgress } = require('ffmpeg-progress-wrapper');
const fs = require('fs');
const path = require('path');
const uploader = require('../upload');
const appConstants = require('../../config/constants');
const _colors = require('colors');


function convertMp4ToMp3(mp4Path, mp3Path, skipUpload = true, progressBar, incrementProgressBarCount) {
    const fileName = path.parse(mp3Path).base;
    let _resolve, _reject
    const promise = new Promise((resolve, reject) => {
        _resolve = resolve
        _reject = reject
    })
    const process = new FFMpegProgress(['-i', mp4Path, '-b:a', '192K', '-vn', '-y', mp3Path]);
    process.on('progress', (progress) => {
        progressBar && progressBar.update(progress.progress)
    });

    process.once('end', () => {
        // Remove unwanted mp4
        fs.unlink(mp4Path, (err) => {
            if (err) throw err;
            console.log(`${mp4Path} was deleted`);
        })

        progressBar && progressBar.update(progressBar.totalSize, {filename: fileName, task: _colors.magenta("Uploading".padEnd(21, ' '))})

        if (!skipUpload) {
            uploader.upload(fileName, progressBar, () => {
                progressBar && progressBar.update(progressBar.totalSize, {filename: fileName, task: _colors.green("Completed".padEnd(21, ' '))});
                progressBar && progressBar.stop();
                if (incrementProgressBarCount) {
                    incrementProgressBarCount(-1)
                }
                _resolve()
            });    
        }
        else {
            progressBar && progressBar.update(progressBar.totalSize, {filename: fileName, task: _colors.green("Completed".padEnd(21, ' '))});
            progressBar && progressBar.setTotal(1)
            progressBar && progressBar.update(1)
            if (incrementProgressBarCount) {
                incrementProgressBarCount(-1)
            }
            _resolve()
        }
    });
    return promise
}

module.exports = {
    convertMp4ToMp3,
}