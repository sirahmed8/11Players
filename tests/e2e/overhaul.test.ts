import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { setMockUser } from './helpers/test-context';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, LocaleProvider } from '@/components/ThemeProvider';
import CommunityPage from '@/app/community/page';
import StatsPage from '@/app/stats/page';
import AdminPage from '@/app/admin/page';
import PlayerProfilePage from '@/app/profile/page';

// Set React act environment flag
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockPathname = '/community';
let mockSearchParams = new Map([['uid', 'admin-123']]);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (url: string) => {
      mockPathname = url.split('?')[0];
      mockPush(url);
    },
    replace: (url: string) => {
      mockPathname = url.split('?')[0];
      mockReplace(url);
    },
    prefetch: () => {}
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key)
  })
}));

// Mock next/link to invoke our mock router on click
jest.mock('next/link', () => {
  return ({ children, href, onClick, ...rest }: any) => {
    const { useRouter } = require('next/navigation');
    const router = useRouter();
    return React.createElement('a', {
      href,
      onClick: (e: any) => {
        e.preventDefault();
        if (onClick) onClick(e);
        router.push(href);
      },
      ...rest
    }, children);
  };
});

describe('E2E Overhaul Verification Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockPathname = '/community';
    mockSearchParams = new Map([['uid', 'admin-123']]);

    // Setup an admin user in the mock auth & firestore
    const mockAdmin = {
      uid: 'admin-123',
      email: 'a7medorabe7@gmail.com',
      displayName: 'Admin User',
      photoURL: 'https://example.com/admin.png'
    };
    setMockUser(mockAdmin);

    const db = getFirestore();
    // Add to admin collection
    await setDoc(doc(db, 'admins', 'admin-123'), { active: true });

    // Seed player document for admin-123
    await setDoc(doc(db, 'players', 'admin-123'), {
      fullName: 'Test Admin Player',
      cardName: 'Admin Player',
      primaryPosition: 'ST',
      calculatedAge: 25,
      height: 180,
      weight: 75,
      preferredFoot: 'Right',
      attributes: {
        attackingProwess: 85,
        defensiveProwess: 50,
        speed: 80,
        acceleration: 82,
        stamina: 78,
        dribbling: 84,
        passing: 80,
        physicalContact: 75,
        shotPower: 85,
        goalkeeping: 15
      },
      stats: {
        goals: 10,
        assists: 5,
        mvp: 2,
        matchesPlayed: 8
      }
    });
  });

  function renderPage(ui: React.ReactElement) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        React.createElement(LocaleProvider, null,
          React.createElement(ThemeProvider, null,
            React.createElement(AuthProvider, null, ui)
          )
        )
      );
    });
    return {
      container,
      unmount: () => {
        act(() => {
          root.unmount();
        });
        container.remove();
      }
    };
  }

  async function flushPromises() {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
  }

  test('Navbar is present on all main pages and page-specific back buttons are replaced', async () => {
    // 1. Community page
    mockPathname = '/community';
    const { container: commContainer, unmount: unmountComm } = renderPage(React.createElement(CommunityPage));
    const commNavbar = commContainer.querySelector('header');
    expect(commNavbar).not.toBeNull();
    
    // Check navigation links
    const commLinks = commNavbar?.querySelectorAll('a');
    const hrefs = Array.from(commLinks || []).map(link => link.getAttribute('href'));
    expect(hrefs).toContain('/community');
    expect(hrefs).toContain('/stats');
    expect(hrefs).toContain('/profile?uid=admin-123');
    expect(hrefs).toContain('/admin');
    
    // Back buttons must NOT be present
    expect(commContainer.textContent).not.toContain('Back to Community');
    unmountComm();

    // 2. Stats page
    mockPathname = '/stats';
    const { container: statsContainer, unmount: unmountStats } = renderPage(React.createElement(StatsPage));
    const statsNavbar = statsContainer.querySelector('header');
    expect(statsNavbar).not.toBeNull();
    expect(statsContainer.textContent).not.toContain('Back to Community');
    // Ensure no arrow back icons exist
    expect(statsContainer.querySelector('.lucide-arrow-left')).toBeNull();
    unmountStats();

    // 3. Admin page
    mockPathname = '/admin';
    const { container: adminContainer, unmount: unmountAdmin } = renderPage(React.createElement(AdminPage));
    const adminNavbar = adminContainer.querySelector('header');
    expect(adminNavbar).not.toBeNull();
    expect(adminContainer.textContent).not.toContain('Back to Community');
    expect(adminContainer.querySelector('.lucide-arrow-left')).toBeNull();
    unmountAdmin();

    // 4. Profile page
    mockPathname = '/profile';
    const { container: profileContainer, unmount: unmountProfile } = renderPage(React.createElement(PlayerProfilePage));
    await flushPromises();
    const profileNavbar = profileContainer.querySelector('header');
    expect(profileNavbar).not.toBeNull();
    expect(profileContainer.textContent).not.toContain('Back to Community');
    unmountProfile();
  });

  test('Transitions between pages are successfully initiated from the Navbar links', () => {
    mockPathname = '/community';
    const { container, unmount } = renderPage(React.createElement(CommunityPage));
    const navbar = container.querySelector('header');
    expect(navbar).not.toBeNull();

    const statsLink = Array.from(navbar?.querySelectorAll('a') || []).find(
      link => link.getAttribute('href') === '/stats'
    );
    expect(statsLink).toBeDefined();
    
    // Simulate clicking Stats page link
    act(() => {
      statsLink?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    
    expect(mockPush).toHaveBeenCalledWith('/stats');
    unmount();
  });

  test('Punctuation for "Live roster of all registered Elite players" displays correctly at the end of the sentence (dir=ltr layout)', () => {
    mockPathname = '/community';
    const { container, unmount } = renderPage(React.createElement(CommunityPage));
    
    // Find the element containing the target text
    const textElements = Array.from(container.querySelectorAll('p')).filter(
      el => el.textContent?.includes('Live roster of all registered Elite players')
    );
    expect(textElements).toHaveLength(1);
    
    // Assert the dir attribute is explicitly "ltr" to guarantee punctuation placement at the end
    expect(textElements[0].getAttribute('dir')).toBe('ltr');
    unmount();
  });

  test('Pages render and transition without long-lived loading spinners', async () => {
    // Standard pages should render immediately without loading spinners because mock data is synchronous
    mockPathname = '/community';
    const { container: commContainer, unmount: unmountComm } = renderPage(React.createElement(CommunityPage));
    expect(commContainer.querySelector('.animate-spin')).toBeNull();
    expect(commContainer.textContent).not.toContain('Loading...');
    unmountComm();

    mockPathname = '/stats';
    const { container: statsContainer, unmount: unmountStats } = renderPage(React.createElement(StatsPage));
    expect(statsContainer.querySelector('.animate-spin')).toBeNull();
    expect(statsContainer.textContent).not.toContain('Loading...');
    unmountStats();

    mockPathname = '/admin';
    const { container: adminContainer, unmount: unmountAdmin } = renderPage(React.createElement(AdminPage));
    expect(adminContainer.querySelector('.animate-spin')).toBeNull();
    expect(adminContainer.textContent).not.toContain('Loading...');
    unmountAdmin();

    mockPathname = '/profile';
    const { container: profileContainer, unmount: unmountProfile } = renderPage(React.createElement(PlayerProfilePage));
    await flushPromises();
    expect(profileContainer.querySelector('.animate-spin')).toBeNull();
    expect(profileContainer.textContent).not.toContain('Loading...');
    unmountProfile();
  });
});
