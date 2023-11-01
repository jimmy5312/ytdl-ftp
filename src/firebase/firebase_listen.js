const { downloadMp4, getMp3Path, getMp4Path } = require("../downloader/downloader");
const { FFMpegProgress } = require('ffmpeg-progress-wrapper');
const { firebaseDb, storage } = require("./server");
const { convertMp4ToMp3 } = require("../converter/converter");
const { getStorage, getDownloadURL } = require('firebase-admin/storage');
const { ref } = require('firebase/storage');

const uuid = require('uuid-v4');
const appConstants = require("../../config/constants");
var fs = require('fs');
var path = require('path');


// As an admin, the app has access to read and write all data, regardless of Security Rules
const db = firebaseDb
let dbRef = db.ref("toDownload");

const setupFirebaseListener = () => {

    let onChangeRef = dbRef.on('child_changed', (snapshot) => {
        let key = snapshot.key
        let child = snapshot.val()
        if (child.mp3FileName && child.status == 'Downloaded') {
            deleteFile(child.mp3FileName)
        }
    })

    let childAddedRef = dbRef.on("child_added", function (snapshot) {
        let key = snapshot.key
        let child = snapshot.val()
        if (child.mp3FileName && child.status == 'Downloaded') {
            deleteFile(child.mp3FileName)
        }
        if (child.url && !child.mp3_url) {
            console.log("Downloading video from " + child.url)

            let randFilename = Math.floor(Math.random() * 100000) + ".mp3"
            randFilename = randFilename.padStart(5, '0')
            let pathMp3 = getMp3Path(randFilename)
            let pathMp4 = getMp4Path(randFilename)
            // let fileNameMp4 = randFilename.replace('.mp3', '.mp4')
    
            updateSongData(key, {
                mp3FileName: randFilename,
                status: "Downloading video",
            })
    
            downloadMp4(child.url, pathMp4, null)
            .then(async () => {
                console.log("Finished downloading video. Converting to mp3")
                updateSongData(key, {
                    status: "Converting to MP3",
                })
    
                return convertMp4ToMp3(pathMp4, pathMp3, true, null)
            })
            .then(async () => {
                let mp3Url = await uploadToStorage(pathMp3)
                let fileSize = getFilesizeInBytes(pathMp3)
                updateSongData(key, {
                    status: "Downloading MP3",
                    mp3_url: mp3Url,
                    fileSize: fileSize,
                })

                return Promise.resolve()
            })
            .then(() => {
                // Trigger to delete the song after 1 minute to avoid wasting Firebase Storage disk quota
                setTimeout(() => {
                    updateSongData(key, {
                        status: "Downloaded",
                    })
                }, 60 * 1000);
            })
        }
    })
}

function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}

function updateSongData(key, data) {
    db.ref('toDownload/' + key).update(data)
}


const uploadToStorage = async (mp3Path) => {
    const bucket = getStorage().bucket()
    const metadata = {
        metadata: {
            // This line is very important. It's to create a download token.
            firebaseStorageDownloadTokens: uuid()
        },
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000',
    };

    // Uploads a local file to the bucket
    await bucket.upload(mp3Path, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        metadata: metadata,
    });

    // Get filename from path
    let fileNameMp3 = path.basename(mp3Path)
    const fileRef = getStorage().bucket().file(fileNameMp3);
    const downloadURL = await getDownloadURL(fileRef);

    console.log(`${fileNameMp3} uploaded, you can download at ${downloadURL}.`);

    return downloadURL
}

setupFirebaseListener()
module.exports = {
    uploadToStorage,
}


// https://firebase.google.com/docs/storage/web/delete-files
const deleteFile = async (fileName) => {
    const fileRef = getStorage().bucket().file(fileName);
    let fileExists = await fileRef.exists()
    if (fileExists[0] == true) {
        // Delete the file using the delete() method
        fileRef.delete().then(function () {

            // File deleted successfully
            console.log(`Done delete ${fileName}`)
        }).catch(function (error) {
            console.log(error)
            // Some Error occurred
        });
    }
}
