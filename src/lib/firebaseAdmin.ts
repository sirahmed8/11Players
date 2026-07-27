import path from 'path';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'an-11-players-firebase-adminsdk-fbsvc-fa4150f290.json');

let adminApp: any = null;
let adminAuth: any = null;
let adminDb: any = null;

try {
  // Dynamically require firebase-admin if present
  const admin = require('firebase-admin');
  if (admin && !admin.apps?.length) {
    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'an-11-players',
      });
    } else {
      adminApp = admin.initializeApp({
        projectId: 'an-11-players',
      });
    }
    adminAuth = admin.auth();
    adminDb = admin.firestore();
  }
} catch (e) {
  // Graceful fallback if firebase-admin package is omitted
}

export { adminApp, adminAuth, adminDb };
