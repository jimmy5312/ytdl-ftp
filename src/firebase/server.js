var admin = require("firebase-admin");
const appConstants = require("../../config/constants");
const { firebaseConfig } = require("../../config/firebase-config");
const { getStorage } = require('firebase-admin/storage');

// Fetch the service account key JSON file contents
var serviceAccount = require(appConstants.firebaseAdminSdkPath)

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // The database URL depends on the location of the database
  databaseURL: firebaseConfig.databaseURL,
  storageBucket: firebaseConfig.storageBucket,
});

module.exports = {
    firebaseDb: admin.database(),
    storage   : admin.storage(),
    bucket    : admin.storage().bucket(),
}
