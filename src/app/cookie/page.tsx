export default function CookiePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-900 dark:text-white min-h-screen">
      <h1 className="text-3xl font-black mb-6">Cookie Policy</h1>
      <p className="text-slate-600 dark:text-slate-300">
        Effective Date: {new Date().getFullYear()}
        <br /><br />
        <b>What are Cookies?</b><br />
        Cookies are small text files stored on your device to help websites function properly and remember your preferences.
        <br /><br />
        <b>How We Use Cookies</b><br />
        11Players uses local storage and cookies strictly for essential functionality:
        <ul className="list-disc pl-6 mt-2 mb-4 space-y-2">
          <li>Authentication sessions (Google Login)</li>
          <li>Saving your language preference (Arabic or English)</li>
          <li>Saving your theme preference (Light or Dark mode)</li>
        </ul>
        We do not use tracking or advertising cookies. By using 11Players, you consent to our use of these essential cookies.
      </p>
    </div>
  );
}
