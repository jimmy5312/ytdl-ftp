const { firebaseDb, storage } = require("../firebase/server");
const { getStorage, getDownloadURL } = require("firebase-admin/storage");
const uuid = require('uuid-v4');
const path = require('path');

const uploadToFirebaseStorage = async (mp3Path) => {
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

module.exports = {
    uploadToFirebaseStorage,
}

// For test
// uploadToFirebaseStorage("1.mp3")