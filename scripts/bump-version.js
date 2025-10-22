const fs = require('fs');
const path = require('path');

const GRADLE_FILE = path.join(__dirname, '../android/app/build.gradle');
const PACKAGE_FILE = path.join(__dirname, '../package.json');

try {
    // Read package.json to get current version
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'));
    const packageVersion = packageJson.version;
    
    // Read gradle file
    let content = fs.readFileSync(GRADLE_FILE, 'utf8');
    
    // Extract current versionCode
    const versionCodeMatch = content.match(/versionCode (\d+)/);
    
    if (versionCodeMatch) {
        const currentVersion = parseInt(versionCodeMatch[1]);
        const newVersion = currentVersion + 1;
        
        // Replace versionCode
        content = content.replace(
            /versionCode \d+/,
            `versionCode ${newVersion}`
        );
        
        // Replace versionName with package.json version
        content = content.replace(
            /versionName "[^"]+"/,
            `versionName "${packageVersion}"`
        );
        
        // Write back
        fs.writeFileSync(GRADLE_FILE, content);
        
        console.log(`✅ Auto-bumped versionCode: ${currentVersion} → ${newVersion}`);
        console.log(`✅ Synced versionName: ${packageVersion}`);
        process.exit(0);
    } else {
        console.log('⚠️ versionCode not found in build.gradle');
        process.exit(0);
    }
} catch (error) {
    console.error('❌ Error bumping version:', error.message);
    process.exit(1);
}
