/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true }) 

admin.initializeApp()
const db = admin.firestore()

/**
 * A. Auth Trigger
 */
exports.onAuthCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user
  await db.collection('users').doc(uid).set({
    username: displayName || '',
    email: email || '',
    gender: '',                        
    age: null,
    role: 'user',                      
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'onAuthCreate'         
  }, { merge: true })
})

/**
 * B. HTTP cloud function
 *    GET https://<region>-<project-id>.cloudfunctions.net/getUserStats
 */
exports.getUserStats = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const snap = await db.collection('users').get()
      const genderCount = { male: 0, female: 0, other: 0, unknown: 0 }
      const ageBuckets = { '12-15': 0, '16-18': 0, '19-22': 0, '23-25': 0, '25+': 0 }

      snap.forEach(doc => {
        const { gender, age } = doc.data() || {}

        // gender
        const g = (gender || '').toString().toLowerCase()
        if (g.includes('male')) genderCount.male++
        else if (g.includes('female')) genderCount.female++
        else if (g) genderCount.other++
        else genderCount.unknown++

        // age buckets
        const a = Number(age)
        if (Number.isFinite(a)) {
          if (a >= 12 && a <= 15) ageBuckets['12-15']++
          else if (a <= 18) ageBuckets['16-18']++
          else if (a <= 22) ageBuckets['19-22']++
          else if (a <= 25) ageBuckets['23-25']++
          else ageBuckets['25+']++
        } else {
          ageBuckets.other++
        }
      })

      res.status(200).json({ genderCount, ageBuckets })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'stats-failed' })
    }
  })
})

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
