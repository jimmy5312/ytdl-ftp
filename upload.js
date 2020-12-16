var myArgs = process.argv.slice(2);
if (myArgs.length == 0) {
    return 0;
}

let uploader = require('./src/upload');

uploader.uploader(myArgs[0])