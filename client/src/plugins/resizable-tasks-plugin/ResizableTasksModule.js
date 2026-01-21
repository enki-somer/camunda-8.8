/**
 * Resizable Tasks Plugin
 * Makes all BPMN task boxes resizable by default with drag handles
 */

import "./resizable-tasks.css";

function ResizableTasksModule(eventBus, elementRegistry, modeling, canvas) {
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._modeling = modeling;
  this._canvas = canvas;

  // Initialize when diagram is ready
  eventBus.on("diagram.init", () => {
    this._setupResizableHandles();
  });

  // Re-setup when elements change
  eventBus.on(["elements.changed", "element.changed"], () => {
    setTimeout(() => this._setupResizableHandles(), 100);
  });
}

// Setup resizable handles for all task elements - optimized
ResizableTasksModule.prototype._setupResizableHandles = function () {
  const elements = this._elementRegistry.getAll();

  // Use requestAnimationFrame to batch DOM operations
  requestAnimationFrame(() => {
    elements.forEach((element) => {
      if (this._isTaskElement(element)) {
        this._addResizeHandles(element);
      }
    });
  });
};

// Check if element is a task that should be resizable
ResizableTasksModule.prototype._isTaskElement = function (element) {
  const taskTypes = [
    "bpmn:Task",
    "bpmn:ServiceTask",
    "bpmn:UserTask",
    "bpmn:ManualTask",
    "bpmn:ScriptTask",
    "bpmn:BusinessRuleTask",
    "bpmn:SendTask",
    "bpmn:ReceiveTask",
    "bpmn:CallActivity",
    "bpmn:SubProcess",
  ];

  return taskTypes.includes(element.type);
};

// Add resize handles to an element
ResizableTasksModule.prototype._addResizeHandles = function (element) {
  const gfx = this._elementRegistry.getGraphics(element);
  if (!gfx || gfx.querySelector(".resize-handles")) return; // Already has handles

  const bounds = element;
  const handleSize = 8;
  const handleOffset = handleSize / 2;

  // Create container for resize handles
  const handlesGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  handlesGroup.classList.add("resize-handles");
  handlesGroup.style.display = "none"; // Hidden by default

  // Handle positions: corners and sides
  const handlePositions = [
    // Corners
    { x: -handleOffset, y: -handleOffset, cursor: "nw-resize", type: "nw" },
    {
      x: bounds.width - handleOffset,
      y: -handleOffset,
      cursor: "ne-resize",
      type: "ne",
    },
    {
      x: bounds.width - handleOffset,
      y: bounds.height - handleOffset,
      cursor: "se-resize",
      type: "se",
    },
    {
      x: -handleOffset,
      y: bounds.height - handleOffset,
      cursor: "sw-resize",
      type: "sw",
    },

    // Sides
    {
      x: bounds.width / 2 - handleOffset,
      y: -handleOffset,
      cursor: "n-resize",
      type: "n",
    },
    {
      x: bounds.width - handleOffset,
      y: bounds.height / 2 - handleOffset,
      cursor: "e-resize",
      type: "e",
    },
    {
      x: bounds.width / 2 - handleOffset,
      y: bounds.height - handleOffset,
      cursor: "s-resize",
      type: "s",
    },
    {
      x: -handleOffset,
      y: bounds.height / 2 - handleOffset,
      cursor: "w-resize",
      type: "w",
    },
  ];

  // Create document fragment for batch DOM operations
  const fragment = document.createDocumentFragment();

  // Create each handle
  handlePositions.forEach((pos) => {
    const handle = this._createResizeHandle(pos, handleSize);
    handle.addEventListener(
      "mousedown",
      (e) => {
        this._startResize(e, element, pos.type);
      },
      { passive: false }
    );
    fragment.appendChild(handle);
  });

  // Add all handles at once
  handlesGroup.appendChild(fragment);
  gfx.appendChild(handlesGroup);

  // Optimized hover handlers with throttling
  let hoverTimeout = null;
  let isVisible = false;

  const showHandles = () => {
    if (!isVisible) {
      isVisible = true;
      handlesGroup.style.display = "block";
    }
  };

  const hideHandles = () => {
    if (isVisible) {
      isVisible = false;
      handlesGroup.style.display = "none";
    }
  };

  gfx.addEventListener(
    "mouseenter",
    () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      showHandles();
    },
    { passive: true }
  );

  gfx.addEventListener(
    "mouseleave",
    () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(hideHandles, 50); // Small delay to prevent flickering
    },
    { passive: true }
  );
};

// Create a single resize handle - optimized for performance
ResizableTasksModule.prototype._createResizeHandle = function (position, size) {
  const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");

  // Set all attributes at once to minimize DOM operations
  const attributes = {
    x: position.x,
    y: position.y,
    width: size,
    height: size,
    fill: "#1976d2",
    stroke: "#ffffff",
    "stroke-width": "1",
    rx: "2",
  };

  Object.entries(attributes).forEach(([key, value]) => {
    handle.setAttribute(key, value);
  });

  handle.style.cursor = position.cursor;
  handle.classList.add("resize-handle");

  // Optimized hover effect using direct style manipulation
  let isHovered = false;

  handle.addEventListener(
    "mouseenter",
    () => {
      if (!isHovered) {
        isHovered = true;
        handle.style.fill = "#1565c0";
      }
    },
    { passive: true }
  );

  handle.addEventListener(
    "mouseleave",
    () => {
      if (isHovered) {
        isHovered = false;
        handle.style.fill = "#1976d2";
      }
    },
    { passive: true }
  );

  return handle;
};

// Start resize operation
ResizableTasksModule.prototype._startResize = function (
  e,
  element,
  handleType
) {
  e.preventDefault();
  e.stopPropagation();

  const startX = e.clientX;
  const startY = e.clientY;
  const startBounds = { ...element };

  const onMouseMove = (e) => {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newBounds = this._calculateNewBounds(
      startBounds,
      deltaX,
      deltaY,
      handleType
    );

    // Apply minimum size constraints
    newBounds.width = Math.max(80, newBounds.width);
    newBounds.height = Math.max(60, newBounds.height);

    // Update element
    this._modeling.resizeShape(element, newBounds);
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    // Refresh handles after resize
    setTimeout(() => this._refreshHandles(element), 50);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

// Calculate new bounds based on handle type and mouse movement
ResizableTasksModule.prototype._calculateNewBounds = function (
  startBounds,
  deltaX,
  deltaY,
  handleType
) {
  const newBounds = { ...startBounds };

  switch (handleType) {
    case "se": // Southeast corner
      newBounds.width = startBounds.width + deltaX;
      newBounds.height = startBounds.height + deltaY;
      break;

    case "sw": // Southwest corner
      newBounds.x = startBounds.x + deltaX;
      newBounds.width = startBounds.width - deltaX;
      newBounds.height = startBounds.height + deltaY;
      break;

    case "ne": // Northeast corner
      newBounds.width = startBounds.width + deltaX;
      newBounds.y = startBounds.y + deltaY;
      newBounds.height = startBounds.height - deltaY;
      break;

    case "nw": // Northwest corner
      newBounds.x = startBounds.x + deltaX;
      newBounds.y = startBounds.y + deltaY;
      newBounds.width = startBounds.width - deltaX;
      newBounds.height = startBounds.height - deltaY;
      break;

    case "n": // North side
      newBounds.y = startBounds.y + deltaY;
      newBounds.height = startBounds.height - deltaY;
      break;

    case "s": // South side
      newBounds.height = startBounds.height + deltaY;
      break;

    case "e": // East side
      newBounds.width = startBounds.width + deltaX;
      break;

    case "w": // West side
      newBounds.x = startBounds.x + deltaX;
      newBounds.width = startBounds.width - deltaX;
      break;
  }

  return newBounds;
};

// Refresh handles after element resize
ResizableTasksModule.prototype._refreshHandles = function (element) {
  const gfx = this._elementRegistry.getGraphics(element);
  if (!gfx) return;

  // Remove old handles
  const oldHandles = gfx.querySelector(".resize-handles");
  if (oldHandles) {
    oldHandles.remove();
  }

  // Add new handles with updated positions
  this._addResizeHandles(element);
};

ResizableTasksModule.$inject = [
  "eventBus",
  "elementRegistry",
  "modeling",
  "canvas",
];

export default {
  __init__: ["resizableTasksModule"],
  resizableTasksModule: ["type", ResizableTasksModule],
};
