/**
 * Call Activity Styling Plugin - Enhanced visual styling for Call Activities
 */

function CallActivityStylingPlugin(eventBus, canvas, elementRegistry) {
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;

  // Apply styling when elements are added
  this._eventBus.on("element.added", (event) => {
    const element = event.element;
    if (this._isCallActivity(element)) {
      setTimeout(() => {
        this._applyCallActivityStyling(element);
      }, 100);
    }
  });

  // Apply styling after diagram import
  this._eventBus.on("import.done", () => {
    setTimeout(() => {
      this._applyCallActivityStylingToAll();
    }, 200);
  });

  // NOTE: element.changed handler removed - causes infinite loops
  // DOM modifications trigger element.changed, creating recursion
  // We rely on element.added and import.done instead

  // Listen for token simulation events to reapply styles
  this._eventBus.on("tokenSimulation.toggle", (event) => {
    if (event.active) {
      setTimeout(() => {
        this._applyCallActivityStylingToAll();
      }, 200);
    }
  });

  // Listen for bpmn-js-token-simulation events
  this._eventBus.on("bpmn-js-token-simulation.toggle", (event) => {
    if (event.active) {
      setTimeout(() => {
        this._applyCallActivityStylingToAll();
      }, 200);
    }
  });

  // Listen for any simulation mode changes
  this._eventBus.on("simulation.toggle", (event) => {
    if (event.active) {
      setTimeout(() => {
        this._applyCallActivityStylingToAll();
      }, 200);
    }
  });
}

// Check if element is a Call Activity
CallActivityStylingPlugin.prototype._isCallActivity = function (element) {
  return element && element.type === "bpmn:CallActivity";
};

// Apply enhanced styling to all Call Activities
CallActivityStylingPlugin.prototype._applyCallActivityStylingToAll =
  function () {
    const allElements = this._elementRegistry.getAll();
    let count = 0;

    allElements.forEach((element) => {
      if (this._isCallActivity(element)) {
        this._applyCallActivityStyling(element);
        count++;
      }
    });
  };

// Apply enhanced styling to specific Call Activity
CallActivityStylingPlugin.prototype._applyCallActivityStyling = function (
  element
) {
  try {
    const gfx = this._elementRegistry.getGraphics(element);
    if (!gfx) return;

    // Find the main rectangle (background)
    const rect = gfx.querySelector("rect");
    if (rect) {
      // Enhanced yellow background - more saturated/intense
      // Use setProperty with !important for higher specificity
      rect.style.setProperty("fill", "#FFD700", "important"); // Gold color - more intense than default yellow
      rect.style.setProperty("fill-opacity", "0.9", "important"); // Slightly more opaque

      // Keep the bold border with high specificity
      rect.style.setProperty("stroke", "#000000", "important"); // Black border
      rect.style.setProperty("stroke-width", "6px", "important"); // Bold border
    }

    // Also style any inner elements if needed
    const innerRect = gfx.querySelector("rect + rect");
    if (innerRect) {
      innerRect.style.setProperty("fill", "#FFD700", "important");
      innerRect.style.setProperty("fill-opacity", "0.8", "important");
    }

    // Remove the plus (+) marker from Call Activity - More aggressive approach

    // Method 1: Hide all small paths and lines (likely plus markers)
    const allMarkers = gfx.querySelectorAll("path, line, g");
    allMarkers.forEach((marker, index) => {
      try {
        const bbox = marker.getBBox ? marker.getBBox() : null;
        const tagName = marker.tagName.toLowerCase();

        if (bbox) {
          // Hide very small elements that are likely decorative markers
          if (bbox.width <= 16 && bbox.height <= 16) {
            marker.style.display = "none";
          }

          // Hide elements with plus-like paths
          if (tagName === "path") {
            const d = marker.getAttribute("d");
            if (d && d.includes("M") && d.includes("L") && bbox.width < 20) {
              marker.style.display = "none";
            }
          }

          // Hide small lines
          if (tagName === "line" && bbox.width < 20 && bbox.height < 20) {
            marker.style.display = "none";
          }
        }
      } catch (e) {
        // Ignore errors for elements without getBBox
      }
    });

    // Method 2: Target specific Call Activity marker classes/selectors
    const callActivityMarkers = gfx.querySelectorAll(
      ".djs-visual > g > path, .djs-visual > g > line, .djs-visual > path, .djs-visual > line"
    );
    callActivityMarkers.forEach((marker) => {
      try {
        const bbox = marker.getBBox();
        if (bbox && bbox.width < 20 && bbox.height < 20) {
          marker.style.display = "none";
        }
      } catch (e) {
        // Ignore
      }
    });

    // Method 3: Remove empty containers and small rectangles (plus marker containers)
    const allElements = gfx.querySelectorAll("*");
    allElements.forEach((el) => {
      const tagName = el.tagName.toLowerCase();

      try {
        const bbox = el.getBBox();
        if (bbox) {
          // Remove small rectangles that might be plus marker containers
          if (tagName === "rect" && bbox.width < 25 && bbox.height < 25) {
            // Check if this is NOT the main Call Activity rectangle
            const isMainRect = bbox.width > 80 || bbox.height > 50;
            if (!isMainRect) {
              el.style.display = "none";
            }
          }

          // Remove any other small elements
          if (tagName !== "rect" && tagName !== "text" && tagName !== "tspan") {
            if (bbox.width < 18 && bbox.height < 18) {
              el.style.display = "none";
            }
          }
        }
      } catch (e) {
        // Ignore elements without getBBox
      }
    });

    // Method 4: Target specific plus marker container patterns
    const containers = gfx.querySelectorAll("rect");
    containers.forEach((container, index) => {
      try {
        const bbox = container.getBBox();
        const fill = container.getAttribute("fill") || container.style.fill;
        const stroke =
          container.getAttribute("stroke") || container.style.stroke;

        // Hide small rectangles that are likely plus marker containers
        if (bbox && bbox.width < 30 && bbox.height < 30) {
          // Make sure it's not the main Call Activity rectangle
          const isMainContainer = bbox.width > 80 && bbox.height > 50;
          if (!isMainContainer) {
            container.style.display = "none";
          }
        }
      } catch (e) {
        // Ignore
      }
    });
  } catch (error) {}
};

// Method to update color intensity
CallActivityStylingPlugin.prototype.setCallActivityColor = function (color) {
  this._callActivityColor = color || "#FFD700";
  this._applyCallActivityStylingToAll();
};

CallActivityStylingPlugin.$inject = ["eventBus", "canvas", "elementRegistry"];

export default {
  __init__: ["callActivityStylingPlugin"],
  callActivityStylingPlugin: ["type", CallActivityStylingPlugin],
};
