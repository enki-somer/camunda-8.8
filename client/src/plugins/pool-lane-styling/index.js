/**
 * Pool Lane Styling Plugin - Makes pool lines blue and thicker
 */

import "./pool-lane-styling.css";

function PoolLaneStylingPlugin(eventBus, canvas, elementRegistry) {
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;

  // COMPLETELY DISABLED - DO NOT MODIFY DOM
  // CSS handles live view styling
  // BpmnEditor._applyPoolLaneStylingToSVG() handles export styling
  // DOM manipulation causes duplicate lines in export
  return;

  // Apply styling when elements are added
  this._eventBus.on("element.added", (event) => {
    const element = event.element;
    if (this._isPoolOrLane(element)) {
      // Apply immediately and also after a delay to catch all elements
      this._applyPoolLaneStyling(element);
      setTimeout(() => {
        this._applyPoolLaneStyling(element);
      }, 100);
    }
  });

  // Apply styling after diagram import
  this._eventBus.on("import.done", () => {
    setTimeout(() => {
      this._applyPoolLaneStylingToAll();
    }, 200);
  });

  // NOTE: element.changed handler removed - causes infinite loops
  // DOM modifications trigger element.changed, creating recursion
  // We rely on element.added, shape.added, and import.done instead

  // Also listen for shape added events (alternative event)
  this._eventBus.on("shape.added", (event) => {
    const element = event.element;
    if (this._isPoolOrLane(element)) {
      this._applyPoolLaneStyling(element);
      setTimeout(() => {
        this._applyPoolLaneStyling(element);
      }, 100);
    }
  });

  // Listen for token simulation events to reapply styles
  this._eventBus.on("tokenSimulation.toggle", (event) => {
    if (event.active) {
      setTimeout(() => {
        this._applyPoolLaneStylingToAll();
      }, 200);
    }
  });

  // Listen for bpmn-js-token-simulation events
  this._eventBus.on("bpmn-js-token-simulation.toggle", (event) => {
    if (event.active) {
      setTimeout(() => {
        this._applyPoolLaneStylingToAll();
      }, 200);
    }
  });

  // Listen for any simulation mode changes
  this._eventBus.on("simulation.toggle", (event) => {
    if (event.active) {
      setTimeout(() => {
        this._applyPoolLaneStylingToAll();
      }, 200);
    }
  });
}

// Check if element is a pool or lane
PoolLaneStylingPlugin.prototype._isPoolOrLane = function (element) {
  return (
    element &&
    (element.type === "bpmn:Participant" || element.type === "bpmn:Lane")
  );
};

// Check if element is a pool (Participant)
PoolLaneStylingPlugin.prototype._isPool = function (element) {
  return element && element.type === "bpmn:Participant";
};

// Check if element is a lane
PoolLaneStylingPlugin.prototype._isLane = function (element) {
  return element && element.type === "bpmn:Lane";
};

// Apply styling to all pools and lanes
PoolLaneStylingPlugin.prototype._applyPoolLaneStylingToAll = function () {
  const allElements = this._elementRegistry.getAll();

  allElements.forEach((element) => {
    if (this._isPoolOrLane(element)) {
      this._applyPoolLaneStyling(element);
    }
  });
};

// Apply styling to specific pool or lane
PoolLaneStylingPlugin.prototype._applyPoolLaneStyling = function (element) {
  // Prevent re-entrancy - skip if already processing this element
  if (!element || !element.id || this._processing.has(element.id)) {
    return;
  }

  this._processing.add(element.id);

  try {
    const gfx = this._elementRegistry.getGraphics(element);
    if (!gfx) {
      this._processing.delete(element.id);
      return;
    }

    if (this._isPool(element)) {
      this._applyPoolStyling(gfx, element);
    } else if (this._isLane(element)) {
      this._applyLaneStyling(gfx, element);
    }

    // Remove from processing set after short delay
    setTimeout(() => {
      this._processing.delete(element.id);
    }, 50);
  } catch (error) {
    // Always remove from processing set on error
    if (element && element.id) {
      this._processing.delete(element.id);
    }
  }
};

// Apply styling to pool (Participant) - Blue border only
PoolLaneStylingPlugin.prototype._applyPoolStyling = function (gfx, element) {
  // Find all possible line elements in the pool
  const rects = gfx.querySelectorAll("rect");
  const paths = gfx.querySelectorAll("path");
  const lines = gfx.querySelectorAll("line");

  // Set SVG attributes directly - this replaces default values and exports correctly
  rects.forEach((rect) => {
    rect.setAttribute("stroke", "#1976D2");
    rect.setAttribute("stroke-width", "3");
  });

  paths.forEach((path) => {
    path.setAttribute("stroke", "#1976D2");
    path.setAttribute("stroke-width", "3");
  });

  lines.forEach((line) => {
    line.setAttribute("stroke", "#1976D2");
    line.setAttribute("stroke-width", "3");
  });
};

// Apply styling to lane - Blue border only
PoolLaneStylingPlugin.prototype._applyLaneStyling = function (gfx, element) {
  // Find all possible line elements in the lane
  const rects = gfx.querySelectorAll("rect");
  const paths = gfx.querySelectorAll("path");
  const lines = gfx.querySelectorAll("line");

  // Set SVG attributes directly - this replaces default values and exports correctly
  rects.forEach((rect) => {
    rect.setAttribute("stroke", "#1976D2");
    rect.setAttribute("stroke-width", "3");
  });

  paths.forEach((path) => {
    path.setAttribute("stroke", "#1976D2");
    path.setAttribute("stroke-width", "3");
  });

  lines.forEach((line) => {
    line.setAttribute("stroke", "#1976D2");
    line.setAttribute("stroke-width", "3");
  });
};

PoolLaneStylingPlugin.$inject = ["eventBus", "canvas", "elementRegistry"];

export default {
  __init__: ["poolLaneStylingPlugin"],
  poolLaneStylingPlugin: ["type", PoolLaneStylingPlugin],
};

/**
 * Apply pool/lane styling to exported SVG string
 * @param {string} svgString - The SVG string to process
 * @param {string[]} poolLaneIds - Array of pool/lane element IDs to style
 * @returns {string} - Styled SVG string (or original if processing fails)
 */
export function applyPoolLaneStylingToSVG(svgString, poolLaneIds) {
  console.log('[applyPoolLaneStylingToSVG] START - poolLaneIds:', poolLaneIds);
  
  if (!svgString || !poolLaneIds || poolLaneIds.length === 0) {
    console.log('[applyPoolLaneStylingToSVG] Early return - no svgString or no IDs');
    return svgString;
  }

  try {
    // Guard: Check if DOMParser is available (may not be in unit tests)
    if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
      console.log('[applyPoolLaneStylingToSVG] DOMParser/XMLSerializer not available');
      return svgString;
    }

    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const doc = parser.parseFromString(svgString, "image/svg+xml");

    // Check for parsing errors
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      console.log('[applyPoolLaneStylingToSVG] Parse error:', parserError.textContent);
      return svgString;
    }

    const svgElement = doc.documentElement;
    if (!svgElement || svgElement.nodeName !== "svg") {
      console.log('[applyPoolLaneStylingToSVG] No SVG element found');
      return svgString;
    }

    console.log('[applyPoolLaneStylingToSVG] SVG parsed successfully');

    // Process each pool/lane ID
    let totalContainersFound = 0;
    let totalElementsStyled = 0;

    poolLaneIds.forEach((id) => {
      if (!id) return;

      // Container selection with fallback
      let container = null;

      // First try: g[data-element-id="ID"] (preferred - group element)
      container = svgElement.querySelector(`g[data-element-id="${id}"]`);

      // Fallback: any element with [data-element-id="ID"]
      if (!container) {
        container = svgElement.querySelector(`[data-element-id="${id}"]`);
      }

      // If none found: skip this ID (don't guess)
      if (!container) {
        console.log(`[applyPoolLaneStylingToSVG] Container NOT found for ID: ${id}`);
        return;
      }

      totalContainersFound++;
      console.log(`[applyPoolLaneStylingToSVG] Container found for ID: ${id}`);

      // Element selection with priority (to avoid styling internal shapes)
      let elementsToStyle = [];

      // Best: .djs-outline (if exists)
      const outlineElements = container.querySelectorAll(".djs-outline rect, .djs-outline path, .djs-outline line");
      if (outlineElements.length > 0) {
        elementsToStyle = Array.from(outlineElements);
        console.log(`[applyPoolLaneStylingToSVG] ID ${id}: Found ${elementsToStyle.length} outline elements`);
      } else {
        // Second: .djs-visual > rect/path/line (direct children)
        const visualContainer = container.querySelector(".djs-visual");
        if (visualContainer) {
          const visualElements = Array.from(visualContainer.children).filter(
            (el) => el.tagName === "rect" || el.tagName === "path" || el.tagName === "line"
          );
          if (visualElements.length > 0) {
            elementsToStyle = visualElements;
            console.log(`[applyPoolLaneStylingToSVG] ID ${id}: Found ${elementsToStyle.length} visual elements`);
          }
        }

        // Fallback: rect, path, line if those classes don't exist
        if (elementsToStyle.length === 0) {
          const fallbackElements = container.querySelectorAll("rect, path, line");
          elementsToStyle = Array.from(fallbackElements);
          console.log(`[applyPoolLaneStylingToSVG] ID ${id}: Found ${elementsToStyle.length} fallback elements`);
        }
      }

      // Apply styling to selected elements
      elementsToStyle.forEach((element) => {
        // Check for existing style attribute that might override
        const existingStyle = element.getAttribute("style") || "";
        console.log(`[applyPoolLaneStylingToSVG] ID ${id}: Element ${element.tagName} existing style:`, existingStyle);
        
        // Set attributes
        element.setAttribute("stroke", "#1976D2");
        element.setAttribute("stroke-width", "3");
        
        // Also update inline style to ensure it takes precedence
        if (existingStyle) {
          // Remove existing stroke/stroke-width from style, then add our values
          const updatedStyle = existingStyle
            .replace(/stroke\s*:\s*[^;]+;?/gi, "")
            .replace(/stroke-width\s*:\s*[^;]+;?/gi, "")
            .trim()
            .replace(/;\s*$/, "") + "; stroke: #1976D2; stroke-width: 3;";
          element.setAttribute("style", updatedStyle);
        } else {
          element.setAttribute("style", "stroke: #1976D2; stroke-width: 3;");
        }
        
        totalElementsStyled++;
      });
    });

    console.log(`[applyPoolLaneStylingToSVG] Summary: ${totalContainersFound} containers found, ${totalElementsStyled} elements styled`);

    // Serialize back to string
    const result = serializer.serializeToString(doc);
    console.log('[applyPoolLaneStylingToSVG] Result contains #1976D2:', result.includes('#1976D2'));
    return result;
  } catch (error) {
    // If anything fails, return original string
    console.error('[applyPoolLaneStylingToSVG] Error:', error);
    return svgString;
  }
}
