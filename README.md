# Camunda Modeler 8.8 - Enhanced Edition

[![CI](https://github.com/camunda/camunda-modeler/actions/workflows/CI.yml/badge.svg)](https://github.com/camunda/camunda-modeler/actions/workflows/CI.yml)

A desktop application for modeling BPMN diagrams, DMN decisions, and Forms, powered by [bpmn.io](https://bpmn.io/). This enhanced version includes advanced visual styling plugins and improved diagram rendering capabilities.

![Camunda Modeler](resources/screenshot.png)

## 🚀 What's New in Version 8.8

This version includes significant enhancements with six powerful plugins that improve diagram visualization, styling, and user experience:

### ✨ New Features

#### 🎨 **BPMN Color Management Plugin**
- **Automatic Standard Colors**: Industry-standard colors applied automatically to BPMN elements
  - Start Events: Green (#4CAF50)
  - Intermediate Events: Orange (#FF9800)
  - End Events: Red (#F44336)
  - Gateways: Orange (#FF9800)
  - Tasks: Yellow (#FFEB3B)
- **Interactive Color Picker**: Right-click any element to access a rich color palette with 20+ professional colors
- **Smart Color Management**: Automatic contrast adjustment and element persistence
- **Context Menu Integration**: Seamless integration with existing BPMN.js context menus

#### 🔗 **Jump Effect Plugin v3.1**
- **Professional Connection Rendering**: Clean jump effects when connection lines intersect
- **One-Way Jump Behavior**: Only one line jumps over another (like professional circuit diagrams)
- **Smart Priority System**: Consistent behavior using element ID comparison
- **Performance Optimized**: Caching, throttling, and debouncing for smooth interactions
- **Visual Clarity**: More obvious jump arcs with preserved arrow heads

#### 🎯 **Call Activity Styling Plugin**
- **Enhanced Visual Styling**: Gold background (#FFD700) with bold black borders for Call Activities
- **Marker Removal**: Automatically removes plus (+) markers for cleaner appearance
- **Simulation Mode Support**: Maintains styling during token simulation
- **Event-Driven Updates**: Automatic styling on element addition and diagram import

#### 📝 **Connection Label Styling Plugin**
- **Improved Readability**: Adds background to sequence flow labels for better visibility
- **Dynamic Updates**: Automatically applies styling when labels are added or edited
- **Direct Editing Support**: Maintains background during label editing
- **Export Compatibility**: Works seamlessly with diagram export functionality

#### 🏊 **Pool & Lane Styling Plugin**
- **Enhanced Pool Lines**: Blue colored, thicker pool and lane boundaries
- **Professional Appearance**: Improved visual distinction between pools and lanes
- **Export Support**: Styling maintained in exported diagrams
- **CSS-Based Styling**: Efficient styling without DOM manipulation overhead

#### 📏 **Resizable Tasks Plugin**
- **Drag Handles**: All task elements now have resize handles for easy resizing
- **Multiple Task Types**: Supports all BPMN task types (Service, User, Manual, Script, Business Rule, Send, Receive, Call Activity, Sub Process)
- **Intuitive Interface**: Corner and side handles for precise control
- **Visual Feedback**: Hover effects and cursor changes during resize operations

### 🔧 Technical Improvements

- **Updated Icons**: New favicon and application icons for better branding
- **Enhanced BPMN Editors**: Improved rendering pipeline for both standard and cloud BPMN editors
- **Icon Generation Task**: New `generate-icon.js` task for automated icon generation
- **Dependency Updates**: Latest package dependencies for improved stability and performance

## 📦 Resources

* [Changelog](./CHANGELOG.md)
* [Download](https://camunda.com/download/modeler/) (see also [nightly builds](https://downloads.camunda.cloud/release/camunda-modeler/nightly/))
* [Give Feedback](https://forum.camunda.io/c/bpmn-modeling/)
* [Report a Bug](https://github.com/camunda/camunda-modeler/issues)
* [User Documentation](https://docs.camunda.io/docs/components/modeler/desktop-modeler/)

## 🏗️ Building the Application

Build the app in a Posix environment. On Windows that is Git Bash or WSL. Make sure you have installed all the [necessary tools](https://github.com/nodejs/node-gyp#installation) to install and compile Node.js C++ addons.

```sh
# checkout a tag
git checkout main

# install dependencies
npm install

# execute all checks (lint, test and build)
npm run all

# build the application to ./dist
npm run build
```

### Development Setup

Spin up the application for development, all strings attached:

```sh
npm run dev
```

## 🎨 Plugin Architecture

All plugins are located in `client/src/plugins/` and are automatically loaded by the BPMN modeler. Each plugin integrates seamlessly with the BPMN.js rendering pipeline and follows the standard plugin architecture.

### Plugin Integration

Plugins are integrated into both standard and cloud BPMN editors:

- **Standard BPMN Editor**: `client/src/app/tabs/bpmn/modeler/BpmnModeler.js`
- **Cloud BPMN Editor**: `client/src/app/tabs/cloud-bpmn/modeler/BpmnModeler.js`

### Plugin Configuration

All plugins work out-of-the-box with sensible defaults. Customization options are available through plugin configuration objects in the modeler initialization.

## 🔌 Plugin Details

### BPMN Color Management Plugin

**Location**: `client/src/plugins/bpmn-color-plugin/`

**Features**:
- Automatic standard BPMN coloring
- Interactive color picker with 20+ colors
- Context menu integration
- Smart contrast adjustment

**Usage**: Colors are applied automatically. Right-click any element to access the color picker.

### Jump Effect Plugin

**Location**: `client/src/plugins/jump-effect-plugin/`

**Features**:
- Professional connection intersection rendering
- One-way jump behavior
- Performance optimized with caching
- Event-driven updates

**Configuration**: Customizable jump size, intersection angle threshold, and jump style.

### Call Activity Styling Plugin

**Location**: `client/src/plugins/call-activity-styling/`

**Features**:
- Gold background with bold borders
- Plus marker removal
- Simulation mode support
- Event-driven styling

### Connection Label Styling Plugin

**Location**: `client/src/plugins/connection-label-styling/`

**Features**:
- Background styling for sequence flow labels
- Dynamic updates on label changes
- Direct editing support
- Export compatibility

### Pool & Lane Styling Plugin

**Location**: `client/src/plugins/pool-lane-styling/`

**Features**:
- Blue colored pool and lane boundaries
- Thicker lines for better visibility
- CSS-based styling
- Export support

### Resizable Tasks Plugin

**Location**: `client/src/plugins/resizable-tasks-plugin/`

**Features**:
- Drag handles for all task types
- Corner and side handles
- Visual feedback
- RequestAnimationFrame optimization

## 🛠️ Development

### Running Tests

```sh
# Run all tests
npm test

# Run client tests
npm run client:test

# Run app tests
npm run app:test

# Auto-test mode (watch)
npm run auto-test
```

### Linting

```sh
# Run linter
npm run lint

# Fix linting issues
npm run format
```

### Building for Production

```sh
# Clean build artifacts
npm run clean

# Build application
npm run build

# Test distribution
npm run build:test-distro
```

## 📝 Contributing

Please checkout our [contributing guidelines](./.github/CONTRIBUTING.md) if you plan to file an issue or pull request.

When contributing plugins or features:
1. Follow the existing plugin architecture patterns
2. Ensure compatibility with both standard and cloud BPMN editors
3. Add appropriate tests for new functionality
4. Update documentation as needed

## 📄 Code of Conduct

By participating to this project, please uphold to our [Code of Conduct](https://github.com/camunda/.github/blob/main/.github/CODE_OF_CONDUCT.md).

## 📜 License

MIT

Uses [bpmn-js](https://github.com/bpmn-io/bpmn-js), [dmn-js](https://github.com/bpmn-io/dmn-js), and [form-js](https://github.com/bpmn-io/form-js) licensed under the [bpmn.io license](http://bpmn.io/license).

## 🎯 Version Information

**Version**: 8.8  
**Base Version**: 5.43.1  
**Enhancement Date**: January 2026

This enhanced version builds upon Camunda Modeler 5.43.1 with additional visual styling and rendering improvements.

## 🔗 Repository

This version is maintained at: https://github.com/enki-somer/camunda-8.8.git

---

**Note**: This is an enhanced version of the Camunda Modeler with additional plugins and features. For the official Camunda Modeler, visit [camunda/camunda-modeler](https://github.com/camunda/camunda-modeler).
