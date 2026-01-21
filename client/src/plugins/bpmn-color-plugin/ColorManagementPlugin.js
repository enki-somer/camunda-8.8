import BpmnRenderer from "bpmn-js/lib/draw/BpmnRenderer";
import inherits from "inherits-browser";
import { append as svgAppend, attr as svgAttr } from "tiny-svg";
import ColorContextPadProvider from "./ColorContextPadProvider.js";
import "./color-picker.css";

function ColorManagementPlugin(
  config,
  eventBus,
  styles,
  pathMap,
  canvas,
  textRenderer,
  elementRegistry,
  contextPad,
  priority = 1500
) {
  BpmnRenderer.call(
    this,
    config,
    eventBus,
    styles,
    pathMap,
    canvas,
    textRenderer,
    priority
  );

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._canvas = canvas;
  this._styles = styles;
  this._contextPad = contextPad;

  // Standard BPMN colors as per your specification
  this.standardColors = {
    "bpmn:StartEvent": "#4CAF50", // Green
    "bpmn:IntermediateThrowEvent": "#FF9800", // Orange
    "bpmn:IntermediateCatchEvent": "#FF9800", // Orange
    "bpmn:EndEvent": "#F44336", // Red
    "bpmn:ExclusiveGateway": "#FF9800", // Orange
    "bpmn:ParallelGateway": "#FF9800", // Orange
    "bpmn:InclusiveGateway": "#FF9800", // Orange
    "bpmn:Task": "#FFEB3B", // Yellow
    "bpmn:ServiceTask": "#FFEB3B", // Yellow
    "bpmn:UserTask": "#FFEB3B", // Yellow
    "bpmn:ManualTask": "#FFEB3B", // Yellow
    "bpmn:ScriptTask": "#FFEB3B", // Yellow
    "bpmn:BusinessRuleTask": "#FFEB3B", // Yellow
    "bpmn:SendTask": "#FFEB3B", // Yellow
    "bpmn:ReceiveTask": "#FFEB3B", // Yellow
    "bpmn:SubProcess": "#FFEB3B", // Yellow
  };

  // Store custom colors for elements
  this.customColors = new Map();

  // Available color palette for color picker
  this.colorPalette = [
    "#F44336",
    "#E91E63",
    "#9C27B0",
    "#673AB7", // Reds/Pinks/Purples
    "#3F51B5",
    "#2196F3",
    "#03A9F4",
    "#00BCD4", // Blues
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39", // Greens
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722", // Yellows/Oranges
    "#795548",
    "#9E9E9E",
    "#607D8B",
    "#000000", // Browns/Greys
    "#FFFFFF", // White
  ];

  // Initialize event handlers
  this._initEventHandlers();

  // Save original handlers
  this._saveOriginalHandlers();

  // Override element rendering
  this._overrideRendering();
}

inherits(ColorManagementPlugin, BpmnRenderer);

// Initialize event handlers
ColorManagementPlugin.prototype._initEventHandlers = function () {
  const eventBus = this._eventBus;

  // Apply colors when elements are added
  eventBus.on("shape.added", (event) => {
    this._applyDefaultColor(event.element);
  });

  // Update colors when elements change
  eventBus.on("elements.changed", (event) => {
    event.elements.forEach((element) => {
      this._updateElementColor(element);
    });
  });

  // Handle element changes (including collapse/expand state changes)
  eventBus.on("element.changed", (event) => {
    const element = event.element;
    // If element is a subprocess, reapply color based on collapsed state
    if (element && element.type === "bpmn:SubProcess") {
      // Remove custom color if it was set, so default logic applies
      if (!this.customColors.has(element.id)) {
        this._applyDefaultColor(element);
      } else {
        // If custom color is set, still update the visual
        this._updateElementColor(element);
      }
    }
  });

  // Handle collapse/expand toggle command
  eventBus.on("commandStack.shape.toggleCollapse.postExecute", (event) => {
    const context = event.context;
    const element = context.shape;
    if (element && element.type === "bpmn:SubProcess") {
      // Reapply color based on new collapsed state
      if (!this.customColors.has(element.id)) {
        this._applyDefaultColor(element);
      } else {
        this._updateElementColor(element);
      }
    }
  });

  // Reapply colors after diagram import/load
  eventBus.on("import.done", () => {
    // Apply colors to all existing elements after import
    setTimeout(() => {
      const allElements = this._elementRegistry.getAll();
      allElements.forEach((element) => {
        if (element && element.type && this.standardColors[element.type]) {
          // For subprocesses, force reapply to check collapsed state
          if (element.type === "bpmn:SubProcess") {
            // Remove any existing custom color to let default logic apply
            if (this.customColors.has(element.id)) {
              const wasCustom = this.customColors.get(element.id);
              // Only remove if it's not a real custom color (i.e., if it's white for collapsed)
              if (
                wasCustom === "#FFFFFF" &&
                this._isCollapsedSubProcess(element)
              ) {
                this.customColors.delete(element.id);
              }
            }
          }
          this._applyDefaultColor(element);
        }
      });
    }, 200);
  });

  // Color management is now handled via ColorContextPadProvider
};

// Save original rendering handlers
ColorManagementPlugin.prototype._saveOriginalHandlers = function () {
  this._originalHandlers = {};

  // Save original shape handlers
  const shapeTypes = [
    "bpmn:StartEvent",
    "bpmn:EndEvent",
    "bpmn:IntermediateThrowEvent",
    "bpmn:IntermediateCatchEvent",
    "bpmn:Task",
    "bpmn:ExclusiveGateway",
    "bpmn:ParallelGateway",
    "bpmn:InclusiveGateway",
    "bpmn:SubProcess",
  ];

  shapeTypes.forEach((type) => {
    if (this.handlers[type]) {
      this._originalHandlers[type] = this.handlers[type];
    }
  });
};

// Override element rendering to apply colors
ColorManagementPlugin.prototype._overrideRendering = function () {
  const self = this;

  // Override shape rendering
  Object.keys(this.standardColors).forEach((elementType) => {
    if (this.handlers[elementType]) {
      this.handlers[elementType] = function (parentGfx, element, attrs) {
        // Call original handler
        const result = self._originalHandlers[elementType].call(
          this,
          parentGfx,
          element,
          attrs
        );

        // Apply colors - for SubProcess, check collapsed state and apply white if collapsed
        if (
          elementType === "bpmn:SubProcess" &&
          self._isCollapsedSubProcess(element)
        ) {
          // For collapsed subprocess, force white color
          const shapeElement = self._findMainShapeElement(parentGfx, element);
          if (shapeElement) {
            svgAttr(shapeElement, "fill", "#FFFFFF");
            const strokeColor = self._getContrastStroke("#FFFFFF");
            svgAttr(shapeElement, "stroke", strokeColor);
          }
        } else {
          // Apply custom colors for other elements
          self._applyColorToElement(parentGfx, element);
        }

        return result;
      };
    }
  });
};

// Apply default color to element
ColorManagementPlugin.prototype._applyDefaultColor = function (element) {
  if (element && element.type && this.standardColors[element.type]) {
    // Only apply if no custom color is set
    if (!this.customColors.has(element.id)) {
      // Check if this is a collapsed subprocess - apply white instead of yellow
      if (this._isCollapsedSubProcess(element)) {
        this._setElementColor(element, "#FFFFFF");
      } else {
        this._setElementColor(element, this.standardColors[element.type]);
      }
    }
  }
};

// Apply color to element's SVG
ColorManagementPlugin.prototype._applyColorToElement = function (
  parentGfx,
  element
) {
  // Special handling for collapsed subprocesses - always white
  if (
    element &&
    element.type === "bpmn:SubProcess" &&
    this._isCollapsedSubProcess(element)
  ) {
    const shapeElement = this._findMainShapeElement(parentGfx, element);
    if (shapeElement) {
      svgAttr(shapeElement, "fill", "#FFFFFF");
      const strokeColor = this._getContrastStroke("#FFFFFF");
      svgAttr(shapeElement, "stroke", strokeColor);
      return;
    }
  }

  const color = this._getElementColor(element);
  if (!color) return;

  // Find the main shape element in the SVG
  const shapeElement = this._findMainShapeElement(parentGfx, element);
  if (shapeElement) {
    svgAttr(shapeElement, "fill", color);

    // Adjust stroke for better visibility
    const strokeColor = this._getContrastStroke(color);
    svgAttr(shapeElement, "stroke", strokeColor);

    // Set appropriate stroke width based on element type
    if (element && element.type && element.type.includes("Gateway")) {
      svgAttr(shapeElement, "stroke-width", "2");
    }
  }
};

// Find the main shape element to color
ColorManagementPlugin.prototype._findMainShapeElement = function (
  parentGfx,
  element
) {
  // Handle different element types specifically
  if (element && element.type) {
    // For gateways, find the diamond polygon (not the internal symbol paths)
    if (element.type.includes("Gateway")) {
      // The diamond shape is actually a polygon, not a path!
      const polygons = parentGfx.querySelectorAll("polygon");

      if (polygons.length > 0) {
        return polygons[0];
      }

      // Fallback to path if no polygon found (shouldn't happen for gateways)
      const paths = Array.from(parentGfx.querySelectorAll("path"));
      return paths[0] || null;
    }

    // For events, look for circles
    if (element.type.includes("Event")) {
      const circle = parentGfx.querySelector("circle");
      if (circle) return circle;
    }

    // For tasks and processes, look for rectangles
    if (element.type.includes("Task") || element.type.includes("Process")) {
      // Find the main rectangle (not border/decoration rects)
      const rects = parentGfx.querySelectorAll("rect");
      for (let rect of rects) {
        // Skip very small rects (likely decorations) and find the main shape
        const width = parseFloat(rect.getAttribute("width") || "0");
        const height = parseFloat(rect.getAttribute("height") || "0");
        if (width > 20 && height > 20) {
          // Main task rectangle is usually larger
          return rect;
        }
      }
      // Fallback to first rect
      return rects[0] || null;
    }
  }

  // Generic fallback: Look for circle (events) or rect (tasks) or path (gateways)
  const circle = parentGfx.querySelector("circle");
  if (circle) return circle;

  const rect = parentGfx.querySelector("rect");
  if (rect) return rect;

  const path = parentGfx.querySelector("path");
  if (path) return path;

  return null;
};

// Check if element is a collapsed subprocess
ColorManagementPlugin.prototype._isCollapsedSubProcess = function (element) {
  if (!element || element.type !== "bpmn:SubProcess") {
    return false;
  }

  // Primary check: element.collapsed property (set when toggled or loaded)
  if (element.collapsed === true) {
    return true;
  }

  // Secondary check: If element has children but they're all hidden, it's collapsed
  if (element.children && element.children.length > 0) {
    const allHidden = element.children.every((child) => child.hidden === true);
    if (allHidden) {
      return true;
    }
  }

  // Tertiary check: Check DI element's isExpanded attribute (from BPMN XML)
  // isExpanded="false" means collapsed, isExpanded="true" or missing means expanded
  try {
    if (element.businessObject) {
      // The DI element might be stored in different ways in bpmn-js
      // Try direct access first
      if (element.businessObject.di) {
        const di = element.businessObject.di;
        if (di.isExpanded === false) {
          return true;
        }
      }

      // Alternative: check if businessObject has a way to get DI
      // Some bpmn-js implementations store it differently
      const diElement =
        element.businessObject.get && element.businessObject.get("di");
      if (diElement && diElement.isExpanded === false) {
        return true;
      }
    }
  } catch (e) {
    // If error accessing, continue with other checks
  }

  // Final check: If no children visible and subprocess exists, assume collapsed
  // This handles edge cases where state might not be fully initialized
  if (element.children && element.children.length === 0) {
    // Can't determine from children, so default to false (not collapsed)
    // unless explicitly set
    return false;
  }

  return false;
};

// Get contrasting stroke color
ColorManagementPlugin.prototype._getContrastStroke = function (fillColor) {
  // Simple contrast calculation
  const hex = fillColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? "#333333" : "#FFFFFF";
};

// Get element color (custom or default)
ColorManagementPlugin.prototype._getElementColor = function (element) {
  if (this.customColors.has(element.id)) {
    return this.customColors.get(element.id);
  }

  if (element.type && this.standardColors[element.type]) {
    // Check if this is a collapsed subprocess - return white instead of yellow
    if (this._isCollapsedSubProcess(element)) {
      return "#FFFFFF";
    }
    return this.standardColors[element.type];
  }

  return null;
};

// Set element color
ColorManagementPlugin.prototype._setElementColor = function (element, color) {
  // Don't store white color for collapsed subprocesses in customColors
  // Treat it as default behavior, not a custom color
  if (this._isCollapsedSubProcess(element) && color === "#FFFFFF") {
    // Remove from customColors if it exists, so default logic applies
    if (this.customColors.has(element.id)) {
      this.customColors.delete(element.id);
    }
  } else {
    // Store custom color for other cases
    this.customColors.set(element.id, color);
  }
  this._updateElementColor(element);
};

// Update element color in the UI
ColorManagementPlugin.prototype._updateElementColor = function (element) {
  const gfx = this._elementRegistry.getGraphics(element);
  if (gfx) {
    this._applyColorToElement(gfx, element);
  }
};

// Color options are now handled by ColorContextPadProvider

// Show color picker
ColorManagementPlugin.prototype._showColorPicker = function (element, event) {
  const self = this;

  // Create color picker overlay
  const colorPicker = this._createColorPicker(element);

  // Position it near the element
  const elementGfx = this._elementRegistry.getGraphics(element);
  const bounds = elementGfx.getBoundingClientRect();

  colorPicker.style.position = "absolute";
  colorPicker.style.left = bounds.left + bounds.width + 10 + "px";
  colorPicker.style.top = bounds.top + "px";
  colorPicker.style.zIndex = "1000";

  document.body.appendChild(colorPicker);

  // Close on click outside
  const closeHandler = (e) => {
    if (!colorPicker.contains(e.target)) {
      document.body.removeChild(colorPicker);
      document.removeEventListener("click", closeHandler);
    }
  };

  setTimeout(() => {
    document.addEventListener("click", closeHandler);
  }, 100);
};

// Create color picker UI
ColorManagementPlugin.prototype._createColorPicker = function (element) {
  const self = this;
  const picker = document.createElement("div");
  picker.className = "bpmn-color-picker";

  // Styles
  picker.style.cssText = `
    background: white;
    border: 2px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    display: grid;
    grid-template-columns: repeat(5, 30px);
    gap: 5px;
    max-width: 170px;
  `;

  // Add reset to default button
  const defaultBtn = document.createElement("button");
  defaultBtn.innerHTML = "↺";
  defaultBtn.title = "Reset to Default";
  defaultBtn.style.cssText = `
    width: 30px;
    height: 30px;
    border: 2px solid #666;
    border-radius: 4px;
    background: linear-gradient(45deg, transparent 40%, #666 40%, #666 60%, transparent 60%);
    cursor: pointer;
    grid-column: span 1;
  `;

  defaultBtn.onclick = () => {
    self.customColors.delete(element.id);
    self._updateElementColor(element);
    document.body.removeChild(picker);
  };

  picker.appendChild(defaultBtn);

  // Add color swatches
  this.colorPalette.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.style.cssText = `
      width: 30px;
      height: 30px;
      background-color: ${color};
      border: 2px solid ${
        color === this._getElementColor(element) ? "#000" : "#ccc"
      };
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    `;

    swatch.onmouseover = () => {
      swatch.style.transform = "scale(1.1)";
    };

    swatch.onmouseout = () => {
      swatch.style.transform = "scale(1)";
    };

    swatch.onclick = () => {
      self._setElementColor(element, color);
      document.body.removeChild(picker);
    };

    picker.appendChild(swatch);
  });

  return picker;
};

ColorManagementPlugin.$inject = [
  "config.bpmnRenderer",
  "eventBus",
  "styles",
  "pathMap",
  "canvas",
  "textRenderer",
  "elementRegistry",
  "contextPad",
];

export default {
  __init__: ["colorManagementPlugin", "colorContextPadProvider"],
  colorManagementPlugin: ["type", ColorManagementPlugin],
  colorContextPadProvider: ["type", ColorContextPadProvider],
};
