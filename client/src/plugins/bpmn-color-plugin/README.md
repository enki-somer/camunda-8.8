# BPMN Color Management Plugin

This plugin provides automatic standard coloring for BPMN elements and an interactive color picker for customization.

## 🎨 Features

### ✅ **Standard BPMN Colors**

Automatically applies industry-standard colors to BPMN elements:

- **Start Events**: 🟢 Green (#4CAF50)
- **Intermediate Events**: 🟠 Orange (#FF9800)
- **End Events**: 🔴 Red (#F44336)
- **Gateways**: 🟠 Orange (#FF9800)
- **Tasks**: 🟡 Yellow (#FFEB3B)

### ✅ **Interactive Color Picker**

- **Context menu integration**: Right-click any element to access color options
- **Rich color palette**: 20+ professional colors to choose from
- **Reset option**: Easily revert to default standard colors
- **Visual feedback**: Hover effects and current color highlighting

### ✅ **Smart Color Management**

- **Automatic contrast**: Stroke colors automatically adjust for visibility
- **Element persistence**: Colors are maintained during diagram editing
- **Type-aware**: Different element types get appropriate default colors
- **Non-intrusive**: Only colors supported BPMN elements

## 🚀 Usage

### Automatic Coloring

1. **Add elements**: Standard colors applied automatically when creating BPMN elements
2. **Professional appearance**: Diagrams instantly look more professional and organized

### Custom Coloring

1. **Right-click element**: Access context menu on any BPMN element
2. **Select color**: Choose from the color palette overlay
3. **Reset option**: Use the ↺ button to return to default color
4. **Instant update**: Color changes apply immediately

## 🎯 Supported Elements

### Events

- Start Events (Green)
- Intermediate Throw/Catch Events (Orange)
- End Events (Red)

### Tasks

- Task, Service Task, User Task (Yellow)
- Manual Task, Script Task (Yellow)
- Business Rule Task, Send Task, Receive Task (Yellow)
- Sub Process (Yellow)

### Gateways

- Exclusive Gateway (Orange)
- Parallel Gateway (Orange)
- Inclusive Gateway (Orange)

## 🎨 Color Palette

The plugin includes a carefully selected palette of professional colors:

**Primary Colors**: Red, Pink, Purple, Indigo, Blue, Light Blue, Cyan
**Secondary Colors**: Teal, Green, Light Green, Lime, Yellow, Amber, Orange, Deep Orange  
**Neutral Colors**: Brown, Grey, Blue Grey, Black, White

## ⚙️ Configuration

The plugin works out-of-the-box with sensible defaults. Colors can be customized by modifying the `standardColors` object in the plugin configuration.

```javascript
// Example custom configuration
{
  colorManagement: {
    standardColors: {
      'bpmn:StartEvent': '#00FF00',      // Custom green
      'bpmn:EndEvent': '#FF0000',        // Custom red
      'bpmn:Task': '#FFFF00'             // Custom yellow
    }
  }
}
```

## 🔧 Technical Details

### Architecture

- **Extends BpmnRenderer**: Integrates seamlessly with BPMN.js rendering pipeline
- **Event-driven**: Responds to element creation and modification events
- **SVG manipulation**: Directly modifies SVG attributes for optimal performance
- **Context pad integration**: Adds color picker to existing UI elements

### Performance

- **Minimal overhead**: Only processes elements that support coloring
- **Efficient updates**: Colors applied during normal rendering cycle
- **Memory efficient**: Custom colors stored in lightweight Map structure

## 🎯 Benefits

### Professional Appearance

- **Standard compliance**: Follows industry-standard BPMN coloring conventions
- **Visual hierarchy**: Different element types are immediately distinguishable
- **Consistency**: Uniform appearance across all diagrams

### User Experience

- **Intuitive interface**: Familiar color picker interaction
- **Quick customization**: Change colors without leaving the diagram
- **Flexible workflow**: Use defaults or customize as needed

### Integration

- **Non-breaking**: Works alongside existing BPMN.js functionality
- **Plugin friendly**: Compatible with other BPMN.js plugins
- **Standard compliance**: Maintains BPMN specification compatibility

## 🚀 Installation

1. **Add plugin files** to your BPMN.js plugin directory
2. **Include in modeler** configuration:

```javascript
import colorManagementPlugin from "./plugins/bpmn-color-plugin/ColorManagementPlugin.js";

const modeler = new BpmnModeler({
  additionalModules: [colorManagementPlugin],
});
```

3. **Elements auto-color** when added to diagrams
4. **Access color picker** via element context menus
