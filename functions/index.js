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
  const ref = db.collection('users').doc(uid)
  const snap = await ref.get()

  if (!snap.exists) {
    await ref.set({
      email: email ?? '',
      role: 'user',
      username: displayName ?? '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'onAuthCreate',
    })
    return
  }

  const toSet = {}
  if (!snap.get('email')) toSet.email = email ?? ''
  if (!snap.get('role'))  toSet.role  = 'user'
  if (Object.keys(toSet).length) {
    await ref.set(toSet, { merge: true })
  }
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


// ====== Public REST APIs (read-only) ======
const PAGE_MAX = 200;

function toSafeUser(doc) {
  const u = doc.data();
  return {
    id: doc.id,
    username: u.username || u.displayName || u.name || '',
    role: (u.role || 'user'),
    gender: u.gender || 'unknown',
    createdAt: (u.createdAt && u.createdAt.toDate ? u.createdAt.toDate().toISOString() : null),
  };
}

// API 1: Public User List
exports.apiUsersPublic = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

      const role = (req.query.role || '').toString().toLowerCase();       // user | admin
      const gender = (req.query.gender || '').toString().toLowerCase();   // male | female | other
      let limit = parseInt(req.query.limit || '50', 10);
      if (!Number.isFinite(limit) || limit <= 0) limit = 50;
      limit = Math.min(limit, PAGE_MAX);

      let ref = db.collection('users').orderBy('createdAt', 'desc');

      if (role === 'user' || role === 'admin') ref = ref.where('role', '==', role);
      if (['male','female','other'].includes(gender)) ref = ref.where('gender', '==', gender);

      // ?cursor=<docId>
      if (req.query.cursor) {
        const cursorDoc = await db.collection('users').doc(req.query.cursor.toString()).get();
        if (cursorDoc.exists) ref = ref.startAfter(cursorDoc);
      }

      const snap = await ref.limit(limit).get();
      const items = snap.docs.map(toSafeUser);
      const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

      res.json({ count: items.length, nextCursor, items });
    } catch (e) {
      console.error(e);
      res.status(500).send('Internal Error');
    }
  });
});

// API 2: User statistics summary (aggregated by role/gender)
exports.apiStatsUsersSummary = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

      const snap = await db.collection('users').limit(2000).get(); 
      let total = 0;
      const byRole = { user: 0, admin: 0, unknown: 0 };
      const byGender = { male: 0, female: 0, other: 0, unknown: 0 };

      snap.forEach(doc => {
        total++;
        const u = doc.data();
        const role = (u.role || 'unknown').toLowerCase();
        const gender = (u.gender || 'unknown').toLowerCase();

        (byRole[role] !== undefined ? byRole : byRole)['unknown']++;
        if (role === 'user' || role === 'admin') byRole[role]++; else byRole.unknown++;

        if (['male','female','other'].includes(gender)) byGender[gender]++; else byGender.unknown++;
      });

      res.json({ totalUsers: total, byRole, byGender, generatedAt: new Date().toISOString() });
    } catch (e) {
      console.error(e);
      res.status(500).send('Internal Error');
    }
  });
});

// API 3: health examination
exports.apiHealth = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => res.json({ ok: true, time: new Date().toISOString() }));
});