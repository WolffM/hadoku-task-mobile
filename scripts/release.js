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
        console.log('💡 Delete the tag first: git tag -d v${version} && git push origin :refs/tags/v${version}');
        process.exit(1);
    } catch {
        // Tag doesn't exist, good to continue
    }

    // Commit version change
    console.log('📝 Committing version change...');
    execSync('git add package.json pnpm-lock.yaml', { stdio: 'inherit' });
    execSync(`git commit -m "Release v${version}"`, { stdio: 'inherit' });
    
    // Push commit
    console.log('⬆️  Pushing commit...');
    execSync('git push', { stdio: 'inherit' });

    // Create annotated tag
    console.log('🏷️  Creating tag...');
    const message = process.argv[2] || `Release v${version}`;
    execSync(`git tag v${version} -m "${message}"`, { stdio: 'inherit' });
    
    // Push tag
    console.log('⬆️  Pushing tag...');
    execSync('git push --tags', { stdio: 'inherit' });
    
    console.log(`✅ Release v${version} created and pushed!`);
    console.log(`📦 GitHub Actions will build and attach the APK.`);
    console.log(`🔗 https://github.com/WolffM/hadoku-task-mobile/releases/tag/v${version}`);
} catch (error) {
    console.error('❌ Release failed:', error.message);
    process.exit(1);
}
