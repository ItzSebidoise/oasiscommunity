// 2FA (TOTP) is performed entirely with the client Supabase SDK from the browser:
//   supabase.auth.mfa.enroll({ factorType: 'totp' })
//   supabase.auth.mfa.challenge({ factorId })
//   supabase.auth.mfa.verify({ factorId, challengeId, code })
//   supabase.auth.mfa.unenroll({ factorId })
// No server functions are needed here; this file exists as a placeholder to keep
// imports tidy if server-side MFA helpers are added later.
export {};
