
// index.js
var path = require('path');

let appRoot = path.join(__dirname , '..')
if (!global.appRoot) {
    global.appRoot = appRoot
}

const appConstants = {
    projectRoot: appRoot,
    firebaseConfigPath: path.join(appRoot , '/config/firebase-config.js'),
    firebaseAdminSdkPath: path.join(appRoot , 'firebase-adminsdk.json'),
}

module.exports = appConstants