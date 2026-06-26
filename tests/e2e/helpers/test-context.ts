// Test Context setup and Mock registrations
import { resetMockDb, setMockUser } from '../mocks/firebase';
import { setupCloudinaryMock } from '../mocks/cloudinary';

// Mock Firebase modules
jest.mock('firebase/app', () => require('../mocks/firebase'));
jest.mock('firebase/auth', () => require('../mocks/firebase'));
jest.mock('firebase/firestore', () => require('../mocks/firebase'));
jest.mock('firebase/storage', () => require('../mocks/firebase'));

// Mock background removal WASM
jest.mock('@imgly/background-removal', () => require('../mocks/bg-removal').default);

// Mock PDF generation
jest.mock('html2canvas', () => require('../mocks/jspdf').html2canvas);
jest.mock('jspdf', () => ({
  jsPDF: require('../mocks/jspdf').jsPDF
}));

// Setup global fetch and standard JSDOM mocks
beforeEach(() => {
  // Reset Firebase Database
  resetMockDb();

  // Setup Cloudinary Mock (which mocks global.fetch)
  setupCloudinaryMock();

  // Mock global storage
  let store: { [key: string]: string } = {};
  const mockLocalStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null
  };

  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true
  });

  // Mock window if running in JSDOM
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
    
    // Mock scrollIntoView, matchMedia or other common DOM APIs
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.matchMedia = window.matchMedia || function() {
      return {
        matches: false,
        addListener: function() {},
        removeListener: function() {}
      };
    };
  }
});

export { resetMockDb, setMockUser };
