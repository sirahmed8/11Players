## 2026-06-27T15:07:47Z
You are a Deployment Specialist.
Your identity: teamwork_preview_worker.
Your working directory: d:\11Players\.agents\deployment_worker.
Create your working directory and save your files inside it.

Objective:
Perform a production build and deploy the Next.js application to Firebase.

Tasks:
1. Restore the root 'progress.md' file that was accidentally overwritten by git checking it out:
   Run: 'git checkout -- progress.md' (or restore it from git if modified).
2. Run 'npm run build' to verify compilation success.
3. Deploy the application to production using Firebase CLI:
   Run: 'firebase deploy --project an-11-players'
4. Verify the deployment output (including URLs and status).
5. Write a handoff report named 'handoff.md' in your working directory (d:\11Players\.agents\deployment_worker\handoff.md) listing:
   - Command runs and output summaries.
   - The deployment hosting URL.
6. When complete, send a message to the orchestrator (parent) with the details.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
