// Google OAuth Configuration
// To enable real Google Sign-In:
// 1. Go to https://console.developers.google.com/
// 2. Create a new project or select existing project
// 3. Enable Google+ API
// 4. Create OAuth 2.0 Client ID credentials
// 5. Add your domain to authorized origins
// 6. Replace the CLIENT_ID below with your actual client ID

export const GOOGLE_CONFIG = {
  // Replace with your actual Google OAuth Client ID
  CLIENT_ID: '175048817524-o1dvmrsjvskvtth2vdno9dn28h3fkpjr.apps.googleusercontent.com',
  
  // Set to true when you have configured your real Google Client ID
  ENABLED: true,
  
  // Authorized domains for production
  AUTHORIZED_DOMAINS: [
    'https://victorlyn.dev',
    'https://www.victorlyn.dev',
    'http://localhost:3000',
    'http://localhost:4321'
  ]
};

// Instructions for setting up Google OAuth:
/*
1. Visit Google Cloud Console: https://console.cloud.google.com/
2. Create or select a project
3. Go to APIs & Services > Credentials
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure consent screen if prompted
6. For Application type, select "Web application"
7. Add authorized JavaScript origins:
   - https://victorlyn.dev
   - https://www.victorlyn.dev
   - http://localhost:4321 (for development)
8. Copy the Client ID and replace CLIENT_ID above
9. Set ENABLED to true
10. Deploy your changes

For development testing, the fallback modal will be used when ENABLED is false.
*/ 