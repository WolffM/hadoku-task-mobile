const fs = require('fs');
const path = require('path');

const GRADLE_FILE = path.join(__dirname, '../android/app/build.gradle');

try {
    // Read the file
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
        
        // Write back
        fs.writeFileSync(GRADLE_FILE, content);
        
        console.log(`✅ Auto-bumped versionCode: ${currentVersion} → ${newVersion}`);
        process.exit(0);
    } else {
        console.log('⚠️ versionCode not found in build.gradle');
        process.exit(0);
    }
} catch (error) {
    console.error('❌ Error bumping version:', error.message);
    process.exit(1);
}
