// conect firebase storage with admin

const admin = require("firebase-admin");

const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://openai-whatsapp-c4b00.appspot.com",
  databaseURL: "https://openai-whatsapp-c4b00.firebaseio.com",
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

module.exports = { bucket, db };
