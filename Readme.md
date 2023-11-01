If you wish to use firebase listener function, please create appropriate Firebase project, then prepare firebase-config.js file as per firebase-config.example.js

Also remember to add firebase-adminsdk.json at root of project

# To download locally
1. Fill up song-list in below format
    youtube-url[tab]filename.mp3

    Example
    https://www.youtube.com/watch?v=Vg1geXqGUg0 陳小滿 - 蠢事.mp3

2. Then run
    $ node download-all.js


# To run firebase listener to download video, convert to mp3, then upload to Firebase Storage
    $ node src/firebase/firebase_listen.js