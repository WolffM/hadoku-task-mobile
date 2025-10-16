# Android Widget Quick Reference

**Quick guide for implementing the Hadoku Task home screen widget**

---

## Widget Flow

```
┌─────────────────────────────────────┐
│  Home Screen (Android 12+)         │
│  ┌─────────────────────────────┐   │
│  │ Hadoku Task          🎨  ⚙ │   │
│  ├─────────────────────────────┤   │
│  │ [Add task...]           ➕  │   │
│  ├─────────────────────────────┤   │
│  │ #work  #home  #urgent       │   │
│  ├─────────────────────────────┤   │
│  │ ☐ Task 1             ✓  ×  │ ◄─┤ User interacts
│  │ ☐ Task 2             ✓  ×  │   │ DIRECTLY in widget
│  │ ☐ Task 3             ✓  ×  │   │ No app opening!
│  │ ...                         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
    Full web app embedded in widget
         (WebView rendering)
```

**Key Difference:** On Android 12+, the entire web app runs INSIDE the widget. No app opening needed!

---

## Files to Create

### 1. Widget Provider (Kotlin)
**Path:** `android/app/src/main/java/me/hadoku/task/TaskWidget.kt`
- Handles widget lifecycle
- Responds to widget updates
- Opens app with intent

### 2. Widget Layout (XML)
**Path:** `android/app/src/main/res/layout/widget_task.xml`
- Defines widget UI
- Buttons, text, icons
- Click handlers

### 3. Widget Config (XML)
**Path:** `android/app/src/main/res/xml/task_widget_info.xml`
- Widget metadata
- Size constraints
- Update frequency

### 4. Widget Drawables (XML)
**Paths:**
- `android/app/src/main/res/drawable/widget_background.xml`
- `android/app/src/main/res/drawable/widget_button_background.xml`

### 5. Manifest Entry (XML)
**Path:** `android/app/src/main/AndroidManifest.xml`
- Register widget receiver
- Link to widget config

### 6. Intent Handler (JavaScript)
**Path:** `src/js/app.js`
- Detect widget launch
- Show quick-add dialog
- Send task to web app

---

## Quick Commands

```bash
# Open Android Studio
npx cap open android

# Sync after making changes
npx cap sync

# Build debug APK
cd android && ./gradlew assembleDebug

# Install on connected device
cd android && ./gradlew installDebug
```

---

## Widget Sizes

| Size | Grid | Dimensions | Aspect Ratio | Use Case |
|------|------|------------|--------------|----------|
| **Full-Screen** | 4x8 | 250x450 dp | 9:16 | **Primary** - Full app experience |
| Tall | 4x6 | 250x340 dp | ~3:4 | Compact version, less scroll |
| Medium | 4x4 | 250x250 dp | 1:1 | Square, very compact |

**Recommended:** 4x8 (full phone screen height in portrait)
- Shows ~5-7 tasks without scrolling
- Full input bar always visible
- Tag filters accessible
- Natural phone usage pattern

---

## Testing Widgets

1. Build and install APK
2. Long-press home screen
3. Tap "Widgets"
4. Find "Hadoku Task"
5. Drag to home screen
6. Tap widget → should open app
7. Verify quick-add dialog appears

---

## Common Issues

### Widget not appearing in picker
- Check `AndroidManifest.xml` has receiver
- Verify `task_widget_info.xml` exists
- Rebuild APK

### Widget tap does nothing
- Check PendingIntent flags include `FLAG_IMMUTABLE`
- Verify MainActivity is registered
- Check intent extras in app.js

### Widget doesn't update
- Reduce `updatePeriodMillis` in widget config
- Call `appWidgetManager.updateAppWidget()` manually
- Check widget service is running

---

## Pro Tips

1. **Use system icons**: `android:icon="@android:drawable/ic_input_add"`
2. **Respect theme**: Read system colors for dark mode
3. **Keep it simple**: Widgets have limited capabilities
4. **Test on multiple launchers**: Samsung, Pixel, etc.
5. **Handle app not running**: Widget should always work

---

## Widget Updates

To update widget content (e.g., show last task):

```kotlin
// In TaskWidget.kt
fun updateWidgetContent(context: Context, appWidgetId: Int, lastTask: String) {
    val views = RemoteViews(context.packageName, R.layout.widget_task)
    views.setTextViewText(R.id.widget_last_task, "Last: $lastTask")
    
    val appWidgetManager = AppWidgetManager.getInstance(context)
    appWidgetManager.updateAppWidget(appWidgetId, views)
}
```

Call from JavaScript via Capacitor plugin (advanced).

---

## Future Enhancements

- [ ] Multiple widget variants (small, medium, large)
- [ ] Show task count on widget
- [ ] Widget configuration screen
- [ ] Direct input in widget (requires RemoteViews limitations workaround)
- [ ] Widget updates when tasks change (requires broadcast receiver)
- [ ] Dark mode support
- [ ] Custom widget themes matching app

---

**Estimated time:** 1.5 hours for basic widget
**Difficulty:** Medium (requires Kotlin knowledge)
**Result:** Users can add tasks from home screen without opening app! 🚀
