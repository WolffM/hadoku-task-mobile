const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`🚀 Creating release v${version}...`);

try {
    // Check if tag already exists
    try {
        execSync(`git rev-parse v${version}`, { stdio: 'ignore' });
        console.log(`❌ Tag v${version} already exists!`);
        console.log('💡 Run "npm version patch" (or minor/major) to bump version first.');
        process.exit(1);
    } catch {
        // Tag doesn't exist, good to continue
    }

    // Create annotated tag
    const message = process.argv[2] || `Release v${version}`;
    execSync(`git tag v${version} -m "${message}"`, { stdio: 'inherit' });
    
    // Push tag
    execSync('git push --tags', { stdio: 'inherit' });
    
    console.log(`✅ Release v${version} created and pushed!`);
    console.log(`📦 GitHub Actions will build and attach the APK.`);
    console.log(`🔗 https://github.com/WolffM/hadoku-task-mobile/releases/tag/v${version}`);
} catch (error) {
    console.error('❌ Release failed:', error.message);
    process.exit(1);
}
