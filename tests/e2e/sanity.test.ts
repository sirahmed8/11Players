import { getAuth, signInWithPopup, signOut, getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, getDoc, getDocs, query, where } from 'firebase/app';
import removeBackground from '@imgly/background-removal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getLanguageState, setLanguageState, getThemeState, setThemeState } from './helpers/dom-simulator';

describe('E2E Infrastructure Sanity Test', () => {
  test('Firebase Auth Mock resolves and fires events correctly', async () => {
    const auth = getAuth();
    expect(auth.currentUser).toBeNull();

    const authStates: any[] = [];
    const unsubscribe = auth.onAuthStateChanged((user) => {
      authStates.push(user);
    });

    // Initial auth state callback
    expect(authStates).toHaveLength(1);
    expect(authStates[0]).toBeNull();

    // Sign in
    const credentials = await signInWithPopup(auth, {});
    expect(credentials.user.uid).toBe('mock-user-123');
    expect(auth.currentUser).not.toBeNull();
    expect(authStates).toHaveLength(2);
    expect(authStates[1].uid).toBe('mock-user-123');

    // Sign out
    await signOut(auth);
    expect(auth.currentUser).toBeNull();
    expect(authStates).toHaveLength(3);
    expect(authStates[2]).toBeNull();

    unsubscribe();
  });

  test('Firebase Firestore Mock performs dynamic CRUD and query filtering', async () => {
    const db = getFirestore();
    const colRef = collection(db, 'players');

    // Add a document
    const docRef1 = await addDoc(colRef, { name: 'Player A', position: 'ST', rating: 85 });
    expect(docRef1.id).toBeDefined();

    // Query all documents
    const allDocsSnap = await getDocs(colRef);
    expect(allDocsSnap.size).toBe(1);
    expect(allDocsSnap.docs[0].data()).toEqual({ id: docRef1.id, name: 'Player A', position: 'ST', rating: 85 });

    // Update document
    const specificDocRef = doc(db, 'players', docRef1.id);
    await updateDoc(specificDocRef, { rating: 86 });

    // Get specific document
    const updatedDocSnap = await getDoc(specificDocRef);
    expect(updatedDocSnap.exists()).toBe(true);
    expect(updatedDocSnap.data()?.rating).toBe(86);

    // Add another document
    const docRef2 = await addDoc(colRef, { name: 'Player B', position: 'GK', rating: 90 });

    // Query with where filter
    const q = query(colRef, where('position', '==', 'GK'));
    const gkDocsSnap = await getDocs(q);
    expect(gkDocsSnap.size).toBe(1);
    expect(gkDocsSnap.docs[0].data()?.name).toBe('Player B');
  });

  test('Firebase Firestore Mock triggers onSnapshot listeners dynamically', async () => {
    const db = getFirestore();
    const colRef = collection(db, 'players');

    const snapChanges: any[] = [];
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      snapChanges.push(snapshot.docs.map(d => d.data()));
    });

    // Initial snapshot (empty)
    expect(snapChanges).toHaveLength(1);
    expect(snapChanges[0]).toHaveLength(0);

    // Add document triggers snapshot
    await addDoc(colRef, { name: 'Player C' });
    expect(snapChanges).toHaveLength(2);
    expect(snapChanges[1]).toHaveLength(1);
    expect(snapChanges[1][0].name).toBe('Player C');

    unsubscribe();
  });

  test('Cloudinary API Mock handles unsigned upload presets via fetch interception', async () => {
    // Correct preset
    const formData = new FormData();
    formData.append('file', 'some-base64-or-blob');
    formData.append('upload_preset', '11players');

    const res = await fetch('https://api.cloudinary.com/v1_1/dfvh4jcsh/image/upload', {
      method: 'POST',
      body: formData
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.secure_url).toContain('res.cloudinary.com');

    // Incorrect preset
    const formDataBad = new FormData();
    formDataBad.append('file', 'some-base64-or-blob');
    formDataBad.append('upload_preset', 'BadPreset');

    const resBad = await fetch('https://api.cloudinary.com/v1_1/dfvh4jcsh/image/upload', {
      method: 'POST',
      body: formDataBad
    });
    expect(resBad.ok).toBe(false);
    expect(resBad.status).toBe(400);
  });

  test('@imgly/background-removal Mock returns transparent PNG blob', async () => {
    const blob = await removeBackground('mock-image-src');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });

  test('jspdf and html2canvas Mocks work as expected', async () => {
    const element = document.createElement('div');
    const canvas = await html2canvas(element);
    expect(canvas.toDataURL()).toContain('data:image/png;base64');

    const doc = new jsPDF();
    doc.text('Test PDF', 10, 10);
    doc.addImage(canvas.toDataURL(), 'PNG', 0, 0, 100, 100);
    await doc.save('test.pdf');

    const pdfBuffer = doc.output('arraybuffer');
    expect(pdfBuffer).toBeInstanceOf(ArrayBuffer);
  });

  test('DOM Simulator language and theme state validation works', () => {
    // Reset to defaults
    setLanguageState('en');
    setThemeState('light');

    expect(getLanguageState()).toEqual({ lang: 'en', dir: 'ltr' });
    expect(getThemeState()).toBe('light');

    // Toggle
    setLanguageState('ar');
    setThemeState('dark');

    expect(getLanguageState()).toEqual({ lang: 'ar', dir: 'rtl' });
    expect(getThemeState()).toBe('dark');
  });
});
