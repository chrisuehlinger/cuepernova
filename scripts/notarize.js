const { notarize } = require('@electron/notarize');
const path = require('path');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Only notarize for macOS
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Check for required environment variables
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_ID_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;
  
  if (!appleId || !appleIdPassword || !teamId) {
    console.warn('Skipping notarization: Missing required environment variables');
    console.warn('Required: APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log('Notarizing application...');
  console.log(`App: ${appPath}`);
  
  try {
    await notarize({
      appPath,
      appleId,
      appleIdPassword,
      teamId,
      // Use notarytool (newer method) instead of legacy altool
      tool: 'notarytool'
    });
    
    console.log('Notarization complete!');
  } catch (error) {
    console.error('Notarization failed:', error);
    // Don't throw error to allow build to continue (for testing)
    // In production, you might want to throw here
    // throw error;
  }
};