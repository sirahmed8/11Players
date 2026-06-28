export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-900 dark:text-white min-h-screen">
      <h1 className="text-3xl font-black mb-6">Privacy Policy</h1>
      <p className="text-slate-600 dark:text-slate-300">
        Effective Date: {new Date().getFullYear()}
        <br /><br />
        Your privacy is important to us. This Privacy Policy explains how 11Players collects, uses, and protects your information when you use our platform.
        <br /><br />
        <b>1. Information We Collect</b><br />
        We collect your Google profile information (name, email, profile picture) when you sign in, as well as the data you enter into your player profile (stats, attributes).
        <br /><br />
        <b>2. How We Use Your Information</b><br />
        Your data is used strictly to provide the matchmaking service, calculate team balance, and display your profile in communities you join.
        <br /><br />
        <b>3. Data Sharing</b><br />
        We do not sell your personal data. Your profile information is visible only to members of the communities you join and the platform administrators.
      </p>
    </div>
  );
}
