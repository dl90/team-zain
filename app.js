'use strict';
/* eslint-disable no-undef */

const express = require("express"),
  helmet = require("helmet"),
  firebase = require("firebase"),
  requestIp = require('request-ip'),
  rateLimit = require("express-rate-limit"),
  // { firebaseConfig } = require("./firebase_config"), // comment when deploying
  { checkUrl } = require("./middleware/checkUrl"),
  app = express();

const fbConfig = {
  apiKey: process.env.apiKey || firebaseConfig.apiKey,
  authDomain: process.env.authDomain || firebaseConfig.authDomain,
  databaseURL: process.env.databaseURL || firebaseConfig.databaseURL,
  projectId: process.env.projectId || firebaseConfig.projectId,
  storageBucket: process.env.storageBucket || firebaseConfig.storageBucket,
  messagingSenderId: process.env.messagingSenderId || firebaseConfig.messagingSenderId,
  appId: process.env.appId || firebaseConfig.appId,
  measurementId: process.env.measurementId || firebaseConfig.measurementId
}

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));
app.use(requestIp.mw());
app.set('trust proxy', true);
app.use(checkUrl)

const reqLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5
});

firebase.initializeApp(fbConfig);
const auth = firebase.auth();
const fireStore = firebase.firestore();

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    let displayName = user.displayName,
      email = user.email,
      emailVerified = user.emailVerified,
      photoURL = user.photoURL,
      isAnonymous = user.isAnonymous,
      uid = user.uid,
      providerData = user.providerData;
    console.log("\n----------------------- auth activity ----------------------------")
    console.log(`uid: ${uid}, email: ${email}, displayName: ${displayName}, emailVerified: ${emailVerified}, photoURL ${photoURL}, isAnonymous ${isAnonymous}, \nproviderData: ${JSON.stringify(providerData)}\n`);
  } else {
    console.log("no user");
  }
});

module.exports = () => {

  const authRoute = require('./routes/auth_route')(auth);
  app.use("/auth", reqLimiter, authRoute);

  const dataRoute = require('./routes/data_route')(fireStore);
  app.use('/data', dataRoute);

  return app;
};
