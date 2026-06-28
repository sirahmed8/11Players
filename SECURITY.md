# Security Policy

## Supported Versions

Currently, only the latest active branch is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| 0.1.x   | :x:                |

## Infrastructure Security

11Players relies on Google Firebase for Authentication and Database (Firestore).
- **Authentication**: All users are authenticated via Google OAuth.
- **Database Rules**: Firestore security rules ensure that users can only modify their own profiles. Only community admins can modify community data, and only the site owner can perform global administrative actions.

## Reporting a Vulnerability

If you discover any security-related issues, please report them directly to the repository maintainers via private communication rather than using the public issue tracker.

We take all security vulnerabilities seriously and will work to address them as quickly as possible. When reporting a vulnerability, please provide:
1. Detailed steps to reproduce the issue.
2. The potential impact of the vulnerability.
3. Any suggested mitigations if known.

Please allow up to 48 hours for an initial response.
