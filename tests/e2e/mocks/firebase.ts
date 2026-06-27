// Mock implementation of Firebase v10 SDK for E2E testing

interface DocData {
  id: string;
  [key: string]: any;
}

let firestoreDb: { [collectionPath: string]: { [docId: string]: any } } = {};
let activeListeners: Array<{
  id: string;
  path: string;
  isQuery: boolean;
  queryConstraints: any[];
  callback: (snapshot: any) => void;
}> = [];

let currentUser: any = null;
const authListeners: Array<(user: any) => void> = [];

export const resetMockDb = () => {
  firestoreDb = {};
  activeListeners = [];
  currentUser = null;
  authListeners.length = 0;
};

export const getMockDb = () => firestoreDb;
export const setMockUser = (user: any) => {
  currentUser = user;
  authListeners.forEach(cb => cb(currentUser));
};

// Query / Filter Helpers
function matchesConstraints(doc: any, constraints: any[]): boolean {
  for (const c of constraints) {
    if (c.type === 'where') {
      const val = doc[c.fieldPath];
      const target = c.value;
      switch (c.opStr) {
        case '==':
          if (val !== target) return false;
          break;
        case '!=':
          if (val === target) return false;
          break;
        case 'array-contains':
          if (!Array.isArray(val) || !val.includes(target)) return false;
          break;
        case '<':
          if (!(val < target)) return false;
          break;
        case '<=':
          if (!(val <= target)) return false;
          break;
        case '>':
          if (!(val > target)) return false;
          break;
        case '>=':
          if (!(val >= target)) return false;
          break;
        default:
          break;
      }
    }
  }
  return true;
}

function processQuery(collectionPath: string, constraints: any[]): any[] {
  const colData = firestoreDb[collectionPath] || {};
  let docs = Object.keys(colData).map(id => ({ id, ...colData[id] }));

  // Filter where
  docs = docs.filter(doc => matchesConstraints(doc, constraints));

  // Sort orderBy
  const orderByConst = constraints.filter(c => c.type === 'orderBy');
  for (const ob of orderByConst) {
    const field = ob.fieldPath;
    const dir = ob.direction || 'asc';
    docs.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (dir === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }

  // Limit
  const limitConst = constraints.find(c => c.type === 'limit');
  if (limitConst) {
    docs = docs.slice(0, limitConst.value);
  }

  return docs;
}

function createDocumentSnapshot(id: string, data: any) {
  return {
    id,
    exists: () => data !== undefined && data !== null,
    data: () => (data ? { ...data } : undefined),
    ref: { id, path: id }
  };
}

function createQuerySnapshot(docs: any[]) {
  const snapshots = docs.map(d => createDocumentSnapshot(d.id, d));
  return {
    docs: snapshots,
    forEach: (callback: (doc: any) => void) => snapshots.forEach(callback),
    empty: snapshots.length === 0,
    size: snapshots.length
  };
}

function triggerListeners(changedPath: string) {
  // changedPath could be collection path like "players" or doc path like "players/123"
  activeListeners.forEach(listener => {
    if (listener.isQuery) {
      if (listener.path === changedPath || changedPath.startsWith(listener.path + '/')) {
        const docs = processQuery(listener.path, listener.queryConstraints);
        const querySnapshot = createQuerySnapshot(docs);
        listener.callback(querySnapshot);
      }
    } else {
      if (listener.path === changedPath) {
        const parts = changedPath.split('/');
        const col = parts[0];
        const docId = parts[1];
        const docData = firestoreDb[col]?.[docId];
        const docSnapshot = createDocumentSnapshot(docId, docData);
        listener.callback(docSnapshot);
      }
    }
  });
}

// SDK Mocks
const mockApp = { name: 'mock-app' };
export const initializeApp = () => mockApp;
export const getApps = () => [];
export const getApp = () => mockApp;
export const initializeFirestore = () => ({ type: 'firestore' });

export const getAuth = () => {
  return {
    currentUser,
    onAuthStateChanged: (cb: (user: any) => void) => {
      authListeners.push(cb);
      cb(currentUser);
      return () => {
        const idx = authListeners.indexOf(cb);
        if (idx > -1) authListeners.splice(idx, 1);
      };
    }
  };
};

export const onAuthStateChanged = (auth: any, cb: (user: any) => void) => {
  authListeners.push(cb);
  cb(currentUser);
  return () => {
    const idx = authListeners.indexOf(cb);
    if (idx > -1) authListeners.splice(idx, 1);
  };
};

export const signInWithPopup = async (auth: any, provider: any) => {
  const user = {
    uid: 'mock-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.png'
  };
  currentUser = user;
  auth.currentUser = user;
  authListeners.forEach(cb => cb(currentUser));
  return { user };
};

export const signOut = async (auth: any) => {
  currentUser = null;
  auth.currentUser = null;
  authListeners.forEach(cb => cb(null));
};

export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com';
  setCustomParameters = jest.fn();
}

export const getFirestore = () => ({ type: 'firestore' });

export const collection = (db: any, path: string) => {
  return { type: 'collection', path, constraints: [] };
};

export const doc = (dbOrColRef: any, pathOrId: string, ...more: string[]) => {
  if (dbOrColRef.type === 'collection') {
    return { type: 'doc', path: dbOrColRef.path + '/' + pathOrId };
  }
  const fullPath = pathOrId + (more.length ? '/' + more.join('/') : '');
  return { type: 'doc', path: fullPath };
};

export const addDoc = async (colRef: any, data: any) => {
  const id = 'doc_' + Math.random().toString(36).substring(2, 11);
  if (!firestoreDb[colRef.path]) {
    firestoreDb[colRef.path] = {};
  }
  firestoreDb[colRef.path][id] = data;
  triggerListeners(colRef.path);
  return { id, path: colRef.path + '/' + id };
};

export const updateDoc = async (docRef: any, data: any) => {
  const parts = docRef.path.split('/');
  const col = parts[0];
  const docId = parts[1];
  if (!firestoreDb[col]) {
    firestoreDb[col] = {};
  }
  if (!firestoreDb[col][docId]) {
    firestoreDb[col][docId] = {};
  }
  firestoreDb[col][docId] = { ...firestoreDb[col][docId], ...data };
  triggerListeners(col);
  triggerListeners(docRef.path);
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  const parts = docRef.path.split('/');
  const col = parts[0];
  const docId = parts[1];
  if (!firestoreDb[col]) {
    firestoreDb[col] = {};
  }
  if (options?.merge) {
    firestoreDb[col][docId] = { ...(firestoreDb[col][docId] || {}), ...data };
  } else {
    firestoreDb[col][docId] = { ...data };
  }
  triggerListeners(col);
  triggerListeners(docRef.path);
};

export const getDoc = async (docRef: any) => {
  const parts = docRef.path.split('/');
  const col = parts[0];
  const docId = parts[1];
  const data = firestoreDb[col]?.[docId];
  return createDocumentSnapshot(docId, data);
};

export const getDocs = async (queryRef: any) => {
  const path = queryRef.path;
  const constraints = queryRef.constraints || [];
  const docs = processQuery(path, constraints);
  return createQuerySnapshot(docs);
};

export const deleteDoc = async (docRef: any) => {
  const parts = docRef.path.split('/');
  const col = parts[0];
  const docId = parts[1];
  if (firestoreDb[col] && firestoreDb[col][docId]) {
    delete firestoreDb[col][docId];
  }
  triggerListeners(col);
  triggerListeners(docRef.path);
};

export const query = (colRef: any, ...constraints: any[]) => {
  return {
    ...colRef,
    constraints: [...(colRef.constraints || []), ...constraints]
  };
};

export const where = (fieldPath: string, opStr: string, value: any) => {
  return { type: 'where', fieldPath, opStr, value };
};

export const limit = (value: number) => {
  return { type: 'limit', value };
};

export const orderBy = (fieldPath: string, direction: 'asc' | 'desc' = 'asc') => {
  return { type: 'orderBy', fieldPath, direction };
};

export const onSnapshot = (refOrQuery: any, callback: (snapshot: any) => void) => {
  const id = 'listener_' + Math.random().toString(36).substring(2, 11);
  const isQuery = refOrQuery.type === 'collection';
  const path = refOrQuery.path;
  const queryConstraints = refOrQuery.constraints || [];

  // Immediate initial invoke
  if (isQuery) {
    const docs = processQuery(path, queryConstraints);
    callback(createQuerySnapshot(docs));
  } else {
    const parts = path.split('/');
    const col = parts[0];
    const docId = parts[1];
    const data = firestoreDb[col]?.[docId];
    callback(createDocumentSnapshot(docId, data));
  }

  activeListeners.push({
    id,
    path,
    isQuery,
    queryConstraints,
    callback
  });

  return () => {
    activeListeners = activeListeners.filter(l => l.id !== id);
  };
};

// Storage Mock
export const getStorage = () => ({ type: 'storage' });
export const ref = (storage: any, path: string) => ({ type: 'storage-ref', path });
export const uploadBytes = async (ref: any, bytes: any) => ({ ref });
export const getDownloadURL = async (ref: any) => {
  return `https://firebasestorage.googleapis.com/v0/b/mock/o/${encodeURIComponent(ref.path)}`;
};
