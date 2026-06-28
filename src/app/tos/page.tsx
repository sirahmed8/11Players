export default function ToSPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-900 dark:text-white min-h-screen">
      <h1 className="text-3xl font-black mb-6">Terms of Service</h1>
      <p className="text-slate-600 dark:text-slate-300">
        Effective Date: {new Date().getFullYear()}
        <br /><br />
        By accessing or using 11Players, you agree to be bound by these Terms of Service.
        <br /><br />
        <b>1. Account Responsibility</b><br />
        You are responsible for maintaining the security of your account and your community passwords.
        <br /><br />
        <b>2. Acceptable Use</b><br />
        You agree not to misuse the platform. Harassment, abusive language, or cheating the matchmaking system will result in community bans or global platform bans.
        <br /><br />
        <b>3. Service Availability</b><br />
        11Players is provided &quot;as is&quot; without warranties. We may modify or discontinue the service at any time.
      </p>
    </div>
  );
}
