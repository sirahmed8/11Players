const fs = require('fs');
const path = require('path');

const pages = [
  'admin/page.tsx',
  'communities/page.tsx',
  'community/page.tsx',
  'global/page.tsx',
  'guide/page.tsx',
  'match/page.tsx',
  'onboarding/page.tsx',
  'owner/page.tsx',
  'profile/page.tsx',
  'stats/page.tsx'
];

pages.forEach(page => {
  const fullPath = path.join('d:\\11Players\\src\\app', page);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove the import statement
    content = content.replace(/import Navbar from ["']@\/components\/Navbar["'];?\r?\n?/g, '');
    
    // Remove the <Navbar /> component instance (could have spaces)
    content = content.replace(/<Navbar\s*\/>\r?\n?/g, '');
    
    fs.writeFileSync(fullPath, content);
    console.log('Processed', page);
  }
});
