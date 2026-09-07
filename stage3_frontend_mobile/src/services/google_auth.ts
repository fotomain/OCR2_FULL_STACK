/**
 * Google OAuth 2.0 Auth Session helper using credentials from run1.docx
 */
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
  clientSecret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  refreshToken: process.env.EXPO_PUBLIC_GOOGLE_REFRESH_TOKEN || 'your-google-refresh-token',
  scopes: ['openid', 'profile', 'email']
};

export const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke'
};
