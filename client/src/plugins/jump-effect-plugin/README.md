# Jump Effect Plugin v3.1 - Professional Connection Renderer

This plugin provides a professional jump effect for BPMN connection lines when they intersect with other connections, improving diagram readability and visual clarity.

## Key Improvements in v3.1

### ✅ **One-Way Jump Behavior**

- **Only one line jumps**: Like professional circuit diagrams, only ONE connection jumps over the other
- **Smart priority system**: Uses element ID comparison to determine which line jumps (consistent behavior)
- **Clean intersections**: No more double-arcs - clear visual hierarchy of which line crosses over

## Previous Improvements in v3

### ✅ **Visual Enhancements**

- **More obvious jump arcs**: Increased visibility so users can clearly see which connection crosses over another
- **Arrow heads preserved**: All connections maintain their proper BPMN arrow heads
- **Professional appearance**: Maintains BPMN standards while adding clear intersection indicators

## Key Improvements in v2

### ✅ Issues Fixed

1. **Persistent Curves**: Jumps now properly disappear when intersecting connections are removed
2. **Laggy Behavior**: Optimized performance with caching and throttling
3. **Visual Mess**: Clean, professional rendering with proper state management
4. **Poor User Experience**: Smooth updates during element movement and editing

### 🏗 Architecture Improvements

#### Event-Driven Updates

- Listens to `elements.changed`, `commandStack.changed`, `connection.changed`
- Automatic cleanup when connections are removed
- Proper lifecycle management with diagram events

#### Performance Optimizations

- **Intersection Caching**: Results cached until connections change
- **Bounding Box Pre-filtering**: Quick elimination of non-intersecting connections
- **Throttled Updates**: Prevents excessive redraws during interactions
- **Debounced Rendering**: Smooth performance during element manipulation

#### State Management

- Tracks which connections currently have jumps
- Efficient cache invalidation on changes
- Proper cleanup on diagram clear

## Configuration

```javascript
// Default configuration
const config = {
  jumpEffect: true, // Enable/disable jump effects
  jumpSize: 12, // Jump height in pixels (more obvious)
  minIntersectionAngle: 30, // Only jump significant intersections
  jumpThreshold: 5, // Minimum distance from connection endpoints
};
```

## Technical Details

### Event Handlers

- `elements.changed`: Updates connections when elements move or change
- `commandStack.changed`: Handles undo/redo and other command operations
- `connection.changed`: Specific connection updates
- `connection.added/removed`: Manages connection lifecycle
- `diagram.clear`: Cleanup on diagram reset

### Rendering Pipeline Integration

- Works with BPMN.js GraphicsFactory for proper updates
- Integrates with existing rendering pipeline instead of overriding
- Maintains compatibility with other renderers and plugins

### Performance Features

- **Bounding Box Intersection**: O(1) elimination of non-intersecting connections
- **Segment Intersection Cache**: Cached calculations with automatic invalidation
- **Throttled Updates**: Maximum 20 updates per second during interactions
- **Debounced Rendering**: 10ms debounce for smooth user interactions

## Usage Examples

### Basic Usage

The plugin automatically activates when loaded. No additional configuration needed for basic functionality.

### Custom Configuration

```javascript
// In your BPMN modeler configuration
{
  additionalModules: [
    {
      jumpConnectionRenderer: ['type', JumpConnectionRenderer]
    }
  ],
  bpmnRenderer: {
    jumpEffect: true,
    jumpSize: 12,
    jumpStyle: 'curvy'
  }
}
```

### Disabling Jump Effects

```javascript
{
  bpmnRenderer: {
    jumpEffect: false;
  }
}
```

## Visual Behavior

### Jump Rendering

- Smooth quadratic Bézier curves for professional appearance
- Automatic perpendicular offset calculation
- Consistent jump direction and sizing
- Proper sorting of multiple jumps on same segment

### Dynamic Updates

- Jumps appear/disappear as connections are added/removed
- Smooth updates during element movement
- No visual artifacts or persistent elements
- Maintains diagram professional appearance

## Browser Compatibility

- All modern browsers supporting SVG and ES6
- Tested with Chrome, Firefox, Safari, Edge
- No external dependencies beyond BPMN.js core

## Troubleshooting

### Performance Issues

- Reduce `jumpSize` for complex diagrams
- Check browser developer tools for memory leaks
- Ensure proper cleanup on diagram destruction

### Visual Artifacts

- Clear browser cache after plugin updates
- Check console for error messages
- Verify BPMN.js version compatibility

### Event Conflicts

- Check for conflicting plugins that modify connection rendering
- Verify event listener priorities
- Ensure proper plugin loading order

## Development Notes

### Plugin Architecture

```
JumpConnectionRenderer
├── Event Handlers (lifecycle management)
├── State Management (tracking & caching)
├── Intersection Calculation (optimized algorithms)
├── Rendering Pipeline (SVG path generation)
└── Performance Optimization (throttling & debouncing)
```

### Extension Points

The plugin can be extended for:

- Custom jump styles
- Different intersection algorithms
- Alternative rendering approaches
- Integration with other diagram elements

### Testing

Test the plugin with:

- Complex diagrams with many intersections
- Dynamic element addition/removal
- Undo/redo operations
- Zoom and pan interactions
- Large diagrams (performance testing)
