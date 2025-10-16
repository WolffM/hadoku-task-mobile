# Mobile UX Implementation Plan

**Goal:** Make Hadoku Task fully functional on mobile with minimal code changes

**Date:** October 15, 2025  
**Based on:** Mobile Compat Low-Code Plan + Original UX Catalog

---

## Strategy Overview

Instead of rebuilding drag-and-drop for touch, we'll:
1. **Kill DnD on touch devices** (feature-gate with CSS/JS)
2. **Add explicit mobile actions** (Tag button, Select mode, Kebab menus)
3. **Use CSS for responsive layout** (stacked columns, scrollable tags)
4. **Reuse existing code** (context menus, tag pickers, bulk operations)

**Result:** All workflows work on mobile with ~200 lines of new code.

---

## Phase 1: Foundation (CSS + Touch Detection)

### 1.1 Touch Detection Hook (5 minutes)

**File:** `src/hooks/useIsTouch.ts` (new)
```typescript
/**
 * Detect if device is touch-based
 * Returns true for phones/tablets, false for desktop
 */
export function useIsTouch(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - some browsers
    navigator.msMaxTouchPoints > 0
  )
}
```

### 1.2 Responsive Layout CSS (15 minutes)

**File:** `src/styles/mobile.css` (new)
```css
/* ============================================
   MOBILE RESPONSIVE LAYOUT
   ============================================ */

/* Stack columns on mobile */
@media (max-width: 768px) {
  .task-app__dynamic-layout {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .task-app__tag-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .task-app__tag-column {
    width: 100%;
  }
}

/* Scrollable tag filters (horizontal tabs) */
@media (max-width: 768px) {
  .task-app__tag-filters {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 8px;
    padding-bottom: 8px;
  }
  
  .task-app__tag-filter {
    scroll-snap-align: start;
    flex-shrink: 0;
  }
}

/* Touch ergonomics - bigger hit targets */
@media (hover: none) and (pointer: coarse) {
  .task-app__action-btn,
  .task-app__sort-btn,
  button {
    min-height: 44px;
    min-width: 44px;
    padding: 10px 12px;
  }
  
  .task-app__item {
    padding: 12px;
    margin-bottom: 8px;
  }
  
  /* Hide desktop-only affordances */
  .drag-handle,
  .marquee-hint {
    display: none !important;
  }
}

/* Bottom action bar for selection mode */
.mobile-action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  bottom: env(safe-area-inset-bottom, 0);
  display: flex;
  gap: 8px;
  padding: 12px;
  background: var(--color-bg-secondary, #f8f9fa);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
  z-index: 100;
}

.mobile-action-bar button {
  flex: 1;
  min-height: 44px;
  border-radius: 8px;
  font-weight: 600;
}

/* Selection checkboxes */
.task-app__item.selection-mode {
  padding-left: 44px;
  position: relative;
}

.task-app__item.selection-mode::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 4px;
}

.task-app__item.selection-mode.selected::before {
  background: var(--color-primary, #667eea);
  border-color: var(--color-primary, #667eea);
}

.task-app__item.selection-mode.selected::after {
  content: '✓';
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  font-weight: bold;
}
```

**File:** `src/styles/index.css`
Add import:
```css
@import './mobile.css';
```

---

## Phase 2: Feature-Gate Desktop Behaviors (10 minutes)

### 2.1 Update App Component

**File:** `src/app/App.tsx`
```tsx
import { useIsTouch } from '../hooks/useIsTouch'

export function App() {
  const isTouch = useIsTouch()
  const [selectionMode, setSelectionMode] = useState(false)
  
  // ... existing state
  
  return (
    <div className="task-app">
      {/* Header with conditional Select button */}
      <header>
        {/* ... existing buttons */}
        
        {isTouch && (
          <button 
            className={`select-mode-btn ${selectionMode ? 'active' : ''}`}
            onClick={() => {
              setSelectionMode(!selectionMode)
              if (!selectionMode) {
                dragAndDrop.clearSelection()
              }
            }}
          >
            {selectionMode ? '✓ Done' : 'Select'}
          </button>
        )}
      </header>
      
      {/* Pass flags to layout */}
      <TaskLayout
        {...props}
        isTouch={isTouch}
        selectionMode={selectionMode}
      />
    </div>
  )
}
```

### 2.2 Update TaskLayout Component

**File:** `src/components/TaskLayout.tsx`
```tsx
interface TaskLayoutProps {
  // ... existing props
  isTouch?: boolean
  selectionMode?: boolean
}

export function TaskLayout({ isTouch, selectionMode, ...props }: TaskLayoutProps) {
  return (
    <div 
      className="task-app__layout"
      // Only enable drag/drop on desktop
      onMouseDown={!isTouch ? props.onSelectionStart : undefined}
      onMouseMove={!isTouch ? props.onSelectionMove : undefined}
      onMouseUp={!isTouch ? props.onSelectionEnd : undefined}
    >
      {/* Render tasks with mobile flags */}
      <TaskItem
        {...taskProps}
        isTouch={isTouch}
        selectionMode={selectionMode}
        isDraggable={!isTouch}
      />
    </div>
  )
}
```

---

## Phase 3: Single Task Tagging (15 minutes)

### 3.1 Add Tag Button to TaskItem

**File:** `src/components/TaskItem.tsx`
```tsx
interface TaskItemProps {
  // ... existing props
  isTouch?: boolean
  selectionMode?: boolean
  onTagClick?: (taskId: string) => void
}

export function TaskItem({ 
  task, 
  isTouch, 
  selectionMode,
  onTagClick,
  ...props 
}: TaskItemProps) {
  return (
    <li 
      className={`task-app__item ${selectionMode ? 'selection-mode' : ''} ${selected ? 'selected' : ''}`}
      data-task-id={task.id}
      draggable={!isTouch && props.isDraggable}
    >
      <div className="task-app__item-content">
        {/* ... existing content */}
      </div>
      
      <div className="task-app__item-actions">
        {/* Complete button (always visible) */}
        <button 
          className="task-app__action-btn task-app__complete-btn"
          onClick={() => props.onComplete(task.id)}
          disabled={props.pendingOperations.has(`complete-${task.id}`)}
        >
          ✓
        </button>
        
        {/* Tag button (mobile only) */}
        {isTouch && onTagClick && (
          <button 
            className="task-app__action-btn task-app__tag-btn"
            onClick={() => onTagClick(task.id)}
            title="Add/change tags"
          >
            🏷️
          </button>
        )}
        
        {/* Delete button (always visible) */}
        <button 
          className="task-app__action-btn task-app__delete-btn"
          onClick={() => props.onDelete(task.id)}
          disabled={props.pendingOperations.has(`delete-${task.id}`)}
        >
          ×
        </button>
      </div>
    </li>
  )
}
```

### 3.2 Add Tag Picker Modal

**File:** `src/components/TagPicker.tsx` (new)
```tsx
import React, { useState } from 'react'

interface TagPickerProps {
  currentTags: string[]
  availableTags: string[]
  onSave: (tags: string[]) => void
  onClose: () => void
}

export function TagPicker({ currentTags, availableTags, onSave, onClose }: TagPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentTags))
  const [newTag, setNewTag] = useState('')
  
  const toggleTag = (tag: string) => {
    const next = new Set(selected)
    if (next.has(tag)) {
      next.delete(tag)
    } else {
      next.add(tag)
    }
    setSelected(next)
  }
  
  const addNewTag = () => {
    if (newTag.trim()) {
      toggleTag(newTag.trim())
      setNewTag('')
    }
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tag-picker" onClick={(e) => e.stopPropagation()}>
        <h3>Select Tags</h3>
        
        {/* Existing tags */}
        <div className="tag-list">
          {availableTags.map(tag => (
            <button
              key={tag}
              className={`tag-chip ${selected.has(tag) ? 'selected' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {selected.has(tag) ? '✓ ' : ''}#{tag}
            </button>
          ))}
        </div>
        
        {/* Add new tag */}
        <div className="new-tag-input">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
            placeholder="New tag..."
          />
          <button onClick={addNewTag}>Add</button>
        </div>
        
        {/* Actions */}
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary"
            onClick={() => onSave(Array.from(selected))}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 3.3 Wire Up Tag Picker in App

**File:** `src/app/App.tsx`
```tsx
const [tagPickerState, setTagPickerState] = useState<{
  taskId: string | null
  taskIds: string[] | null
  currentTags: string[]
} | null>(null)

// Single task tagging
function handleTagClick(taskId: string) {
  const task = tasks.find(t => t.id === taskId)
  if (!task) return
  
  setTagPickerState({
    taskId,
    taskIds: null,
    currentTags: task.tag?.split(' ').filter(Boolean) || []
  })
}

// Bulk tagging
function handleBulkTag(taskIds: string[]) {
  setTagPickerState({
    taskId: null,
    taskIds,
    currentTags: [] // Start with no tags for bulk
  })
}

// Save tags
async function handleTagPickerSave(tags: string[]) {
  if (!tagPickerState) return
  
  const tagString = tags.join(' ')
  
  if (tagPickerState.taskId) {
    // Single task
    await updateTask(tagPickerState.taskId, { tag: tagString })
  } else if (tagPickerState.taskIds) {
    // Bulk update
    await bulkUpdateTaskTags(tagPickerState.taskIds.map(id => ({
      taskId: id,
      tag: tagString
    })))
  }
  
  setTagPickerState(null)
}

// In render:
{tagPickerState && (
  <TagPicker
    currentTags={tagPickerState.currentTags}
    availableTags={boards?.boards.find(b => b.id === currentBoardId)?.tags || []}
    onSave={handleTagPickerSave}
    onClose={() => setTagPickerState(null)}
  />
)}
```

---

## Phase 4: Selection Mode (20 minutes)

### 4.1 Selection State Management

Already handled in Phase 2.1 - reuse existing `dragAndDrop.selectedIds` state.

### 4.2 Add Bottom Action Bar

**File:** `src/app/App.tsx`
```tsx
// In render, after main content:
{isTouch && selectionMode && dragAndDrop.selectedIds.size > 0 && (
  <div className="mobile-action-bar">
    <button 
      onClick={() => handleBulkTag(Array.from(dragAndDrop.selectedIds))}
      className="btn-secondary"
    >
      🏷️ Tag ({dragAndDrop.selectedIds.size})
    </button>
    <button 
      onClick={() => handleBulkMove(Array.from(dragAndDrop.selectedIds))}
      className="btn-secondary"
    >
      📁 Move ({dragAndDrop.selectedIds.size})
    </button>
    <button 
      onClick={() => handleBulkDelete(Array.from(dragAndDrop.selectedIds))}
      className="btn-danger"
    >
      🗑️ Delete ({dragAndDrop.selectedIds.size})
    </button>
  </div>
)}
```

### 4.3 Selection Toggle on TaskItem

**File:** `src/components/TaskItem.tsx`
```tsx
// Add click handler for selection mode
<li 
  className={`task-app__item ${selectionMode ? 'selection-mode' : ''} ${selected ? 'selected' : ''}`}
  onClick={selectionMode ? () => onToggleSelection?.(task.id) : undefined}
>
```

**File:** `src/app/App.tsx`
```tsx
function handleToggleSelection(taskId: string) {
  const next = new Set(dragAndDrop.selectedIds)
  if (next.has(taskId)) {
    next.delete(taskId)
  } else {
    next.add(taskId)
  }
  // Update selection state (modify dragAndDrop hook to expose setter)
}
```

---

## Phase 5: Kebab Menus (15 minutes)

### 5.1 Add Kebab Buttons

**File:** `src/components/BoardButton.tsx`
```tsx
export function BoardButton({ board, onContextMenu, isTouch }: Props) {
  return (
    <div className="board-button-wrapper">
      <button className="board-button" onClick={...}>
        {board.name}
      </button>
      
      {/* Kebab menu (always show, works on desktop too) */}
      <button 
        className="kebab-btn"
        onClick={(e) => {
          e.stopPropagation()
          onContextMenu?.({
            ...e,
            clientX: e.clientX,
            clientY: e.clientY
          })
        }}
        title="Board options"
      >
        ⋮
      </button>
    </div>
  )
}
```

**File:** `src/components/TagFilterButton.tsx`
```tsx
// Similar kebab button for tag filters
<button 
  className="kebab-btn"
  onClick={(e) => {
    e.stopPropagation()
    onContextMenu?.(e)
  }}
>
  ⋮
</button>
```

### 5.2 Keep Right-Click for Desktop

Context menu code already exists - just make sure it works with both right-click AND kebab buttons (they both call `onContextMenu`).

---

## Phase 6: Testing & Polish (30 minutes)

### 6.1 Test Checklist

Run through mobile UX catalog checklist:
- [ ] Create task works (text input + keyboard)
- [ ] Complete task works (button tap)
- [ ] Delete task works (button tap)
- [ ] Single task tagging works (Tag button → picker → save)
- [ ] Enter selection mode (Select button in header)
- [ ] Multi-select tasks (tap to toggle checkboxes)
- [ ] Bulk tag assignment (action bar → Tag button)
- [ ] Bulk move (action bar → Move button)
- [ ] Bulk delete (action bar → Delete button)
- [ ] Board options (kebab menu)
- [ ] Tag options (kebab menu)
- [ ] Columns stack on mobile
- [ ] Tag filters scroll horizontally
- [ ] Hit targets are 44px minimum
- [ ] No desktop-only features block workflows

### 6.2 Mobile-Specific Styles

**File:** `src/styles/mobile.css`
Add:
```css
/* Kebab buttons */
.kebab-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--color-text-secondary);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.kebab-btn:hover,
.kebab-btn:active {
  opacity: 1;
}

@media (hover: none) {
  .kebab-btn {
    opacity: 0.8; /* Always visible on touch */
  }
}

/* Tag picker modal */
.tag-picker {
  max-width: 400px;
  padding: 20px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.tag-chip {
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-chip.selected {
  background: var(--color-primary, #667eea);
  border-color: var(--color-primary, #667eea);
  color: white;
}

.new-tag-input {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.new-tag-input input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
}

/* Selection mode button in header */
.select-mode-btn {
  padding: 8px 16px;
  border: 2px solid var(--color-primary, #667eea);
  border-radius: 8px;
  background: white;
  color: var(--color-primary, #667eea);
  font-weight: 600;
  cursor: pointer;
}

.select-mode-btn.active {
  background: var(--color-primary, #667eea);
  color: white;
}
```

---

## Implementation Order

1. **Day 1 (1 hour):** Phase 1 (CSS) + Phase 2 (feature gates)
2. **Day 2 (1.5 hours):** Phase 3 (single task tagging)
3. **Day 3 (1 hour):** Phase 4 (selection mode)
4. **Day 4 (1 hour):** Phase 5 (kebab menus)
5. **Day 5 (1 hour):** Phase 6 (testing & polish)

**Total:** ~5.5 hours of actual coding

---

## What We're NOT Doing (Yet)

❌ **Long-press gestures** - Too complex, use explicit Select button instead  
❌ **Touch drag-and-drop** - Spotty support, explicit actions are clearer  
❌ **Gesture libraries** - Adds complexity and bundle size  
❌ **Custom scroll handling** - Use native scrolling  
❌ **Swipe actions** - Can add later if needed  

---

## Success Criteria

✅ All workflows from MOBILE_UX_CATALOG.md work on touch devices  
✅ No JavaScript errors on mobile browsers  
✅ Smooth scrolling and interactions  
✅ No desktop features block mobile usage  
✅ Bundle size increase < 10KB  
✅ Code changes isolated to new files + minimal existing file edits  

---

## Next Steps

1. Create `useIsTouch.ts` hook
2. Add `mobile.css` stylesheet
3. Create `TagPicker.tsx` component
4. Update `App.tsx`, `TaskLayout.tsx`, `TaskItem.tsx` with mobile flags
5. Add kebab buttons to existing components
6. Test on actual mobile device
7. Ship! 🚀

**Total LOC:** ~200 new lines, ~50 modified lines
**Files touched:** 7 files modified, 3 files created
**Risk:** Low (feature-gated, can be disabled if issues)
