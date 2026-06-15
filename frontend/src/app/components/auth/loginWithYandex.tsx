/**
 * Yandex OAuth 2.0.
 * Docs: https://yandex.ru/dev/id/doc/ru/
 *
 * Replace CLIENT_ID and REDIRECT_URI with real values from
 * https://oauth.yandex.ru/
 */
export async function loginWithYandex(): Promise<void> {
  const YANDEX_CLIENT_ID = 'YOUR_YANDEX_CLIENT_ID';
  const REDIRECT_URI = encodeURIComponent(window.location.origin + '/auth/yandex/callback');

  const authUrl =
    `https://oauth.yandex.ru/authorize` +
    `?response_type=code` +
    `&client_id=${YANDEX_CLIENT_ID}` +
    `&redirect_uri=${REDIRECT_URI}`;

  // TODO: open authUrl in an in-app browser / WebView, capture the callback
  // and exchange the `code` for an access token on your backend.
  console.info('[Yandex Auth] Redirect to:', authUrl);
  window.location.href = authUrl;
}
