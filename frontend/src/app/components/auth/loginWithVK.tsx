/**
 * VKontakte OAuth 2.0 (PKCE flow).
 * Docs: https://dev.vk.com/api/oauth-parameters
 *
 * Replace CLIENT_ID and REDIRECT_URI with real values from
 * https://vk.com/apps?act=manage
 */
export async function loginWithVK(): Promise<void> {
  const VK_CLIENT_ID = 'YOUR_VK_APP_ID';
  const REDIRECT_URI = encodeURIComponent(window.location.origin + '/auth/vk/callback');
  const SCOPE = 'email'; // space-separated list of permissions

  // For a native/webview flow you would use VK Bridge instead:
  // import bridge from '@vkontakte/vk-bridge';
  // await bridge.send('VKWebAppGetAuthToken', { app_id: VK_CLIENT_ID, scope: SCOPE });

  const authUrl =
    `https://oauth.vk.com/authorize` +
    `?client_id=${VK_CLIENT_ID}` +
    `&redirect_uri=${REDIRECT_URI}` +
    `&display=mobile` +
    `&scope=${SCOPE}` +
    `&response_type=code` +
    `&v=5.199`;

  // TODO: open authUrl in an in-app browser / WebView, capture the callback
  // and exchange the `code` for an access token on your backend.
  console.info('[VK Auth] Redirect to:', authUrl);
  window.location.href = authUrl;
}
