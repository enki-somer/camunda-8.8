---
name: Pool Lane Export Styling
overview: Add functionality to apply blue pool/lane styling to exported SVG files, matching the live view styling. The plugin will process the SVG string after export to apply stroke styling to pool and lane elements.
todos:
  - id: add-export-function
    content: "Add pure utility function applyPoolLaneStylingToSVG(svgString, poolLaneIds) as named export. Use DOMParser/XMLSerializer with container fallback (g[data-element-id] first, then any [data-element-id]). Style with priority: .djs-outline > .djs-visual > rect/path/line. Don't modify default export."
    status: completed
  - id: modify-bpmn-editor
    content: Modify BpmnEditor.exportSVG() in client/src/app/tabs/bpmn/BpmnEditor.js to get pool/lane IDs from elementRegistry and apply styling
    status: completed
  - id: modify-cloud-bpmn-editor
    content: Modify BpmnEditor.exportSVG() in client/src/app/tabs/cloud-bpmn/BpmnEditor.js to get pool/lane IDs from elementRegistry and apply styling
    status: completed
---

# Pool Lane Export Styling Plugin

## Overview

Extend the existing pool-lane-styling plugin to handle exported SVG styling. The live view uses CSS (which works perfectly), but CSS doesn't apply to exported SVG files. We need to process the SVG string directly to apply the blue stroke styling.

## Implementation

### 1. Add Pure Utility Function

**File**: `client/src/plugins/pool-lane-styling/index.js`

- Export a pure utility function (no DOM mutation, no side effects):
  ```javascript
  export function applyPoolLaneStylingToSVG(svgString, poolLaneIds) { ... }
  ```

- Implementation details:
  - Use `DOMParser` to parse the SVG string
  - Use `XMLSerializer` to serialize back to string
  - **Container selection with fallback** (priority order):

    1. First try: `g[data-element-id="ID"]` (preferred - group element)
    2. Fallback: any element with `[data-element-id="ID"]`
    3. If none found: skip that ID (don't guess)

  - **Element selection with priority** (to avoid styling internal shapes like labels/separators):

    1. Best: `.djs-outline` (if exists)
    2. Second: `.djs-visual > :is(rect,path,line)` (direct children)
    3. Fallback: `rect,path,line` if those classes don't exist

  - Set `stroke="#1976D2"` and `stroke-width="3"` attributes on selected elements
  - Guard: If parsing fails (e.g., DOMParser unavailable in unit tests), return original `svgString` via try/catch
  - Guard: Only target shapes under the identified pool/lane containers (don't globally rewrite all rect/path/line)
- **Export strategy**: Export as named export `export function applyPoolLaneStylingToSVG(...)` without modifying the default plugin export (keep existing `export default { ... }` intact)

### 2. Modify BpmnEditor Export Methods

**Files**:

- `client/src/app/tabs/bpmn/BpmnEditor.js`
- `client/src/app/tabs/cloud-bpmn/BpmnEditor.js`

- Import the `applyPoolLaneStylingToSVG` function from the plugin
- Modify `exportSVG()` method to:
  - Get the SVG from `modeler.saveSVG()`
  - Get pool/lane IDs from elementRegistry:
    ```javascript
    const elementRegistry = modeler.get('elementRegistry');
    const ids = elementRegistry.getAll()
      .filter(e => e.type === 'bpmn:Participant' || e.type === 'bpmn:Lane')
      .map(e => e.id);
    ```

  - Call `applyPoolLaneStylingToSVG(svg, ids)` to apply styling
  - Return the styled SVG

## Technical Details

- The plugin currently has CSS that styles pools/lanes with `stroke: #1976D2` and `stroke-width: 3px`
- The export styling should match these exact values
- Need to handle both `bpmn:Participant` (pools) and `bpmn:Lane` elements
- The SVG structure may vary, so the method should be robust in finding pool/lane elements

## Files to Modify

1. `client/src/plugins/pool-lane-styling/index.js` - Add export styling method
2. `client/src/app/tabs/bpmn/BpmnEditor.js` - Integrate export styling
3. `client/src/app/tabs/cloud-bpmn/BpmnEditor.js` - Integrate export styling