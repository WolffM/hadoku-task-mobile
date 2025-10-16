# GitHub Actions Deployment Guide

## 🚀 Automated APK Builds

Your project now has GitHub Actions set up to automatically build APKs!

### What Happens Automatically

**On every push to `main`:**
- ✅ Installs dependencies
- ✅ Syncs Capacitor
- ✅ Builds debug APK
- ✅ Uploads APK as artifact (downloadable for 30 days)

**On version tags (e.g., `v1.0.0`):**
- ✅ Everything above, plus:
- ✅ Creates a GitHub Release
- ✅ Attaches APK to the release

### How to Use

#### 1. Push Code to Trigger Build

```bash
git add .
git commit -m "Update app"
git push
```

GitHub Actions will automatically start building!

#### 2. Download the APK

1. Go to your repo on GitHub
2. Click "Actions" tab
3. Click on the latest workflow run
4. Scroll down to "Artifacts"
5. Download `app-debug.apk`

#### 3. Create a Release Version

When you're ready to release a version:

```bash
# Bump version in package.json first
npm version patch  # or minor, or major

# Push with tags
git push --follow-tags
```

GitHub Actions will:
- Build the APK
- Create a GitHub Release
- Attach the APK to the release

### View Build Status

Add this badge to your README.md:

```markdown
![Build APK](https://github.com/YOUR_USERNAME/hadoku-task-mobile/actions/workflows/build-apk.yml/badge.svg)
```

### Troubleshooting

**Build fails?**
- Check the Actions log in GitHub
- Common issues:
  - Node version mismatch (using 20)
  - Missing dependencies (check package.json)
  - Gradle issues (usually auto-fixed)

**Can't find APK?**
- Check the "Artifacts" section at the bottom of the workflow run page
- Artifacts expire after 30 days (configurable in workflow)

**Want signed release APK?**
- Need to add keystore as GitHub secret
- See: https://docs.github.com/en/actions/security-guides/encrypted-secrets

### Manual Build (If Needed)

You can still build locally:

```bash
npx cap sync
cd android
./gradlew assembleDebug
```

APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🎉 That's It!

Now every time you push code, GitHub builds your APK automatically. No Android Studio needed on your machine!

### Quick Deploy Workflow

1. Edit `www/` files (HTML/CSS/JS)
2. Commit and push to GitHub
3. Wait ~5 minutes for build
4. Download APK from Actions
5. Install on device and test!

### Next Steps

- [ ] Push code to GitHub to test the workflow
- [ ] Download and test the built APK
- [ ] Create your first release with `npm version patch`
- [ ] Add the build status badge to README
- [ ] (Optional) Set up signed release builds
