/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Optional EmailJS integration for client-side email dispatch.
 *
 * HOW TO ENABLE (when ready):
 *   1. Resolve the react-quill peer-dependency conflict first, then install:
 *        npm install @emailjs/browser --legacy-peer-deps
 *
 *   2. Create a `.env.local` file in the `frontend/` directory and add:
 *        VITE_EMAILJS_SERVICE_ID=your_service_id
 *        VITE_EMAILJS_TEMPLATE_ID=your_template_id
 *        VITE_EMAILJS_PUBLIC_KEY=your_public_key
 *
 *   3. In your EmailJS dashboard, create a template with these variables:
 *        {{to_email}}   — recipient address
 *        {{reset_url}}  — the full reset password URL
 *        {{year}}       — current year (for footer)
 *
 *   4. Uncomment the implementation block in sendPasswordResetEmail() below.
 *
 * Until the package is installed this module is a safe no-op: every call
 * resolves with { sent: false, reason: 'not_configured' } and the app
 * continues to work normally using the backend-generated dev link.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const isConfigured = !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/**
 * Attempt to send a password-reset email via EmailJS.
 * Currently a no-op stub — see HOW TO ENABLE above.
 *
 * @param {string} toEmail  - Recipient email address
 * @param {string} resetUrl - Full reset URL
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
export async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (!isConfigured) {
    return { sent: false, reason: 'not_configured' };
  }

  // ── Uncomment the block below after installing @emailjs/browser ────────────
  //
  // try {
  //   const { default: emailjs } = await import('@emailjs/browser');
  //   await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
  //     to_email: toEmail,
  //     reset_url: resetUrl,
  //     year: new Date().getFullYear(),
  //   }, PUBLIC_KEY);
  //   return { sent: true };
  // } catch (err) {
  //   console.error('[EmailJS] Failed to send reset email:', err);
  //   return { sent: false, reason: err?.message ?? 'unknown_error' };
  // }
  // ──────────────────────────────────────────────────────────────────────────

  console.warn('[EmailJS] Package not yet installed. Set VITE_EMAILJS_* env vars and install @emailjs/browser to enable.');
  return { sent: false, reason: 'package_not_installed' };
}

export { isConfigured as isEmailJsConfigured };
