# Cuestation Refactoring Plan

## Overview
Merging cuestation.html and mapping.html into a single unified page with integrated Maptastic support and centralized data storage in db.json.

## Key Changes

### 1. Data Model Updates
- Add `showtimeResolution` field to Cuestation type (width, height)
- Move mapping data from localStorage to db.json
- Default resolution: 1920x1080

### 2. Page Consolidation
- Merge mapping.html functionality into cuestation.html
- Rename "mapping-frame" to "its-showtime" (combine functionality)
- Remove iframe approach - direct content rendering

### 3. File Changes

#### Files to Modify:
- `/workspace/src/shared/types/index.ts` - Update Cuestation interface
- `/workspace/static/cuestation.html` - Integrate Maptastic
- `/workspace/static-src/js/cuestation.ts` - Add mapping support
- `/workspace/src-react/components/CuestationManager.tsx` - New creation flow
- `/workspace/src-react/screens/MainScreen.tsx` - Remove mapping button
- `/workspace/electron/ipc/handlers.ts` - Add cuestation data endpoint
- `/workspace/src/server/sockets.ts` - Serve cuestation configuration

#### Files to Delete:
- `/workspace/static/mapping.html`
- `/workspace/static-src/js/mapping.ts`
- `/workspace/static-src/css/mapping.css`

## Implementation Steps

### Step 1: Update Data Models
```typescript
interface Cuestation {
  id: string;
  name: string;
  description?: string;
  showtimeResolution: {
    width: number;
    height: number;
  };
  mapping?: {
    // Maptastic configuration data
    layers?: Array<{
      targetPoints: number[][];
      sourcePoints: number[][];
    }>;
  };
}
```

### Step 2: Merge HTML Pages
- Add Maptastic library to cuestation.html
- Create unified div structure with id="its-showtime"
- Maintain content display functionality

### Step 3: Update TypeScript
- Initialize Maptastic on page load
- Fetch cuestation config from server
- Apply showtime resolution to div
- Load and apply mapping configuration

### Step 4: Update React Components
- Add resolution fields to creation modal
- Remove separate mapping button
- Update edit functionality for resolution

### Step 5: Server Endpoints
- Create GET /api/cuestation/:name endpoint
- Return resolution and mapping data
- Handle default mapping creation

## Default Maptastic Mapping
When creating a new cuestation, initialize with Maptastic's default mapping:
```javascript
// Default is typically:
{
  layers: [{
    targetPoints: [
      [0, 0], [1, 0], [1, 1], [0, 1]
    ],
    sourcePoints: [
      [0, 0], [1, 0], [1, 1], [0, 1]
    ]
  }]
}
```

## Migration Notes
- No backwards compatibility needed
- Remove all localStorage references
- Clean up mapping-related code

## Completed Tasks
✅ Updated data models with showtimeResolution and mapping
✅ Merged cuestation.html and mapping.html into single page
✅ Integrated Maptastic directly into cuestation.ts
✅ Updated CuestationManager.tsx with resolution fields
✅ Created API endpoint for cuestation configuration
✅ Removed all mapping file references
✅ Updated CLAUDE.md documentation
✅ Fixed TypeScript compilation errors
✅ Successfully built both Electron and React code

## Testing Checklist
- [ ] Cuestation creation with resolution
- [ ] Cuestation display with proper dimensions
- [ ] Maptastic initialization and transforms
- [ ] Content display functionality preserved
- [ ] WebSocket message handling
- [ ] OSC command processing
- [ ] All content types (video, image, message, etc.)

## Potential Issues to Watch
- CSS conflicts between old styles
- JavaScript library load order
- Transform origin calculations
- Resolution vs viewport sizing