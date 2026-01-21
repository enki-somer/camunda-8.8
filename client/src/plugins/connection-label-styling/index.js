/**
 * Connection Label Styling Plugin - Adds background to sequence flow labels for better readability
 */

import "./connection-label-styling.css";

function ConnectionLabelStylingPlugin(eventBus, canvas, elementRegistry) {
  console.log("[ConnectionLabelStyling] Plugin initialized");
  
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;

  // Track processed labels to avoid duplicates
  this._processedLabels = new Set();
  this._observers = new Map();

  // Apply styling when elements are added
  this._eventBus.on("element.added", (event) => {
    const element = event.element;
    console.log("[ConnectionLabelStyling] element.added event:", element?.type, element?.id);
    if (this._isSequenceFlow(element)) {
      console.log("[ConnectionLabelStyling] Sequence flow added, scheduling background apply");
      setTimeout(() => {
        this._applyLabelBackground(element);
      }, 100);
    }
  });

  // Apply styling after diagram import
  this._eventBus.on("import.done", () => {
    console.log("[ConnectionLabelStyling] import.done event");
    setTimeout(() => {
      this._applyLabelBackgroundToAll();
    }, 200);
  });

  // Update label background when direct editing completes
  this._eventBus.on("directEditing.complete", (event) => {
    const element = event.element;
    console.log("[ConnectionLabelStyling] directEditing.complete event:", element?.type, element?.id);
    // Check if it's a label element
    if (element && element.type === "label") {
      const labelId = element.id;
      if (labelId && labelId.endsWith("_label")) {
        const connectionId = labelId.replace(/_label$/, "");
        const connection = this._elementRegistry.get(connectionId);
        if (connection && this._isSequenceFlow(connection)) {
          console.log("[ConnectionLabelStyling] Direct editing completed on label, reapplying background");
          setTimeout(() => {
            this._applyLabelBackground(connection);
          }, 100);
        }
      }
    } else if (element && this._isSequenceFlow(element)) {
      console.log("[ConnectionLabelStyling] Direct editing completed on sequence flow");
      setTimeout(() => {
        this._applyLabelBackground(element);
      }, 100);
    }
  });

  // Also listen for direct editing activation to ensure background is there
  this._eventBus.on("directEditing.activate", (event) => {
    const element = event.element;
    if (element && element.type === "label") {
      const labelId = element.id;
      if (labelId && labelId.endsWith("_label")) {
        const connectionId = labelId.replace(/_label$/, "");
        const connection = this._elementRegistry.get(connectionId);
        if (connection && this._isSequenceFlow(connection)) {
          console.log("[ConnectionLabelStyling] Direct editing activated on label, ensuring background");
          setTimeout(() => {
            this._applyLabelBackground(connection);
          }, 50);
        }
      }
    }
  });

  // Also listen for connection added events
  this._eventBus.on("connection.added", (event) => {
    const element = event.connection || event.element;
    console.log("[ConnectionLabelStyling] connection.added event:", element?.type, element?.id);
    if (this._isSequenceFlow(element)) {
      setTimeout(() => {
        this._applyLabelBackground(element);
      }, 100);
    }
  });

  // Listen for rendering events
  this._eventBus.on("render.connection", (event) => {
    const element = event.element;
    console.log("[ConnectionLabelStyling] render.connection event:", element?.type, element?.id);
    if (element && this._isSequenceFlow(element)) {
      setTimeout(() => {
        this._applyLabelBackground(element);
      }, 50);
    }
  });

  // Listen for shape moves/updates to reapply background
  this._eventBus.on("shape.move", (event) => {
    const element = event.shape || event.element;
    if (element && element.type === "label") {
      // Check if this label belongs to a sequence flow
      const labelId = element.id;
      if (labelId && labelId.endsWith("_label")) {
        const connectionId = labelId.replace(/_label$/, "");
        const connection = this._elementRegistry.get(connectionId);
        if (connection && this._isSequenceFlow(connection)) {
          console.log("[ConnectionLabelStyling] Label moved, reapplying background");
          setTimeout(() => {
            this._applyLabelBackground(connection);
          }, 50);
        }
      }
    }
  });

  // Listen for element changes (including label updates)
  this._eventBus.on("element.changed", (event) => {
    const element = event.element;
    if (element && element.type === "label") {
      const labelId = element.id;
      if (labelId && labelId.endsWith("_label")) {
        const connectionId = labelId.replace(/_label$/, "");
        const connection = this._elementRegistry.get(connectionId);
        if (connection && this._isSequenceFlow(connection)) {
          console.log("[ConnectionLabelStyling] Label element changed, reapplying background");
          setTimeout(() => {
            this._applyLabelBackground(connection);
          }, 50);
        }
      }
    }
  });

  // Listen for command stack changes (when labels are edited via commands)
  this._eventBus.on("commandStack.element.updateLabel.postExecuted", (event) => {
    const element = event.context.element;
    if (element && this._isSequenceFlow(element)) {
      console.log("[ConnectionLabelStyling] Label updated via command, reapplying background");
      setTimeout(() => {
        this._applyLabelBackground(element);
      }, 100);
    }
  });

  // Listen for any rendering updates
  this._eventBus.on("render.shape", (event) => {
    const element = event.element;
    if (element && element.type === "label") {
      const labelId = element.id;
      if (labelId && labelId.endsWith("_label")) {
        const connectionId = labelId.replace(/_label$/, "");
        const connection = this._elementRegistry.get(connectionId);
        if (connection && this._isSequenceFlow(connection)) {
          console.log("[ConnectionLabelStyling] Label shape rendered, reapplying background");
          setTimeout(() => {
            this._applyLabelBackground(connection);
          }, 50);
        }
      }
    }
  });

  // Listen for element updates
  this._eventBus.on("element.updateId", (event) => {
    const element = event.element;
    if (element && this._isSequenceFlow(element)) {
      console.log("[ConnectionLabelStyling] Connection ID updated, reapplying background");
      setTimeout(() => {
        this._applyLabelBackground(element);
      }, 50);
    }
  });

  // Listen for graphics updates
  this._eventBus.on("graphics.update", (event) => {
    const element = event.element;
    if (element && element.type === "label") {
      const labelId = element.id;
      if (labelId && labelId.endsWith("_label")) {
        const connectionId = labelId.replace(/_label$/, "");
        const connection = this._elementRegistry.get(connectionId);
        if (connection && this._isSequenceFlow(connection)) {
          console.log("[ConnectionLabelStyling] Label graphics updated, reapplying background");
          setTimeout(() => {
            this._applyLabelBackground(connection);
          }, 50);
        }
      }
    }
  });

  // Listen for shape render events
  this._eventBus.on("shape.render", (event) => {
    const element = event.element;
    console.log("[ConnectionLabelStyling] shape.render event:", element?.type, element?.id);
    if (element && this._isSequenceFlow(element)) {
      setTimeout(() => {
        this._applyLabelBackground(element);
      }, 50);
    }
  });

  // Listen for label shapes being added (labels are separate shapes)
  this._eventBus.on("shape.added", (event) => {
    const element = event.element;
    console.log("[ConnectionLabelStyling] shape.added event:", element?.type, element?.id);
    // Check if this is a label for a sequence flow
    // Labels can have type "label" or be identified by their businessObject
    if (element) {
      const isLabel = element.type === "label" || 
                      (element.businessObject && element.businessObject.$type === "bpmn:Label");
      
      if (isLabel) {
        console.log("[ConnectionLabelStyling] Label detected, finding host connection");
        // Try to find the host connection
        let host = element.host || element.parent;
        
        // If no direct host, try extracting connection ID from label ID
        // Label IDs often follow pattern: {connectionId}_label
        if (!host && element.id && element.id.endsWith("_label")) {
          const connectionId = element.id.replace(/_label$/, "");
          console.log("[ConnectionLabelStyling] Extracted connection ID from label ID:", connectionId);
          host = this._elementRegistry.get(connectionId);
          if (host) {
            console.log("[ConnectionLabelStyling] Found connection by ID:", host.id, host.type);
            // Verify it's a sequence flow
            if (!this._isSequenceFlow(host)) {
              console.log("[ConnectionLabelStyling] Extracted element is not a sequence flow:", host.type);
              host = null;
            }
          } else {
            console.log("[ConnectionLabelStyling] Connection not found in registry, searching all elements:", connectionId);
            // Fallback: search all elements
            const allElements = this._elementRegistry.getAll();
            allElements.forEach((el) => {
              if (el.id === connectionId) {
                console.log("[ConnectionLabelStyling] Found element with matching ID:", el.id, el.type);
                if (this._isSequenceFlow(el)) {
                  host = el;
                  console.log("[ConnectionLabelStyling] It's a sequence flow! Using as host");
                }
              }
            });
          }
        }
        
        // If still no host, check businessObject references
        if (!host && element.businessObject && typeof element.businessObject === 'object') {
          const labelBO = element.businessObject;
          console.log("[ConnectionLabelStyling] Label businessObject type:", labelBO.$type);
          // Label might reference a connection through its parent
          if (labelBO.$parent) {
            console.log("[ConnectionLabelStyling] Label has parent:", labelBO.$parent.$type, labelBO.$parent.id);
            // Find the connection element that owns this label
            const allElements = this._elementRegistry.getAll();
            allElements.forEach((el) => {
              if (this._isSequenceFlow(el) && el.businessObject === labelBO.$parent) {
                host = el;
                console.log("[ConnectionLabelStyling] Found connection via businessObject:", el.id);
              }
            });
          }
        }
        
        if (host && this._isSequenceFlow(host)) {
          console.log("[ConnectionLabelStyling] Label shape added for sequence flow:", host.id);
          setTimeout(() => {
            this._applyLabelBackground(host);
          }, 100);
        } else {
          console.log("[ConnectionLabelStyling] Label found but no sequence flow host:", element.id);
          console.log("[ConnectionLabelStyling] Label element properties:", {
            type: element.type,
            id: element.id,
            host: element.host?.id,
            parent: element.parent?.id || element.parent,
            businessObjectType: typeof element.businessObject === 'object' ? element.businessObject?.$type : typeof element.businessObject,
            businessObjectParent: typeof element.businessObject === 'object' ? element.businessObject?.$parent?.id : 'N/A'
          });
          
          // Try one more time with direct ID extraction and registry lookup
          if (element.id && element.id.endsWith("_label")) {
            const connectionId = element.id.replace(/_label$/, "");
            console.log("[ConnectionLabelStyling] Retry: Looking for connection:", connectionId);
            const allElements = this._elementRegistry.getAll();
            allElements.forEach((el) => {
              if (el.id === connectionId) {
                console.log("[ConnectionLabelStyling] Found element with matching ID:", el.id, el.type);
                if (this._isSequenceFlow(el)) {
                  console.log("[ConnectionLabelStyling] It's a sequence flow! Applying background");
                  setTimeout(() => {
                    this._applyLabelBackground(el);
                  }, 100);
                }
              }
            });
          }
        }
      }
    }
  });

  // Clean up when elements are removed
  this._eventBus.on("element.removed", (event) => {
    const element = event.element;
    if (element && this._isSequenceFlow(element)) {
      console.log("[ConnectionLabelStyling] element.removed, cleaning up:", element.id);
      this._cleanupLabel(element);
    }
  });

  // Listen for diagram clear
  this._eventBus.on("diagram.clear", () => {
    console.log("[ConnectionLabelStyling] diagram.clear event");
    this._processedLabels.clear();
    this._observers.forEach((observer) => {
      observer.disconnect();
    });
    this._observers.clear();
  });
}

// Check if element is a sequence flow
ConnectionLabelStylingPlugin.prototype._isSequenceFlow = function (element) {
  const isSequenceFlow = element && element.type === "bpmn:SequenceFlow";
  if (element && !isSequenceFlow) {
    console.log("[ConnectionLabelStyling] Element is not sequence flow:", element.type);
  }
  return isSequenceFlow;
};

// Apply label background to all sequence flows
ConnectionLabelStylingPlugin.prototype._applyLabelBackgroundToAll = function () {
  const allElements = this._elementRegistry.getAll();
  console.log("[ConnectionLabelStyling] Applying background to all sequence flows, total elements:", allElements.length);

  let sequenceFlowCount = 0;
  allElements.forEach((element) => {
    if (this._isSequenceFlow(element)) {
      sequenceFlowCount++;
      this._applyLabelBackground(element);
    }
  });
  console.log("[ConnectionLabelStyling] Found", sequenceFlowCount, "sequence flows");
};

// Apply label background to specific sequence flow
ConnectionLabelStylingPlugin.prototype._applyLabelBackground = function (
  element
) {
  console.log("[ConnectionLabelStyling] _applyLabelBackground called for:", element.id);
  
  try {
    const gfx = this._elementRegistry.getGraphics(element);
    if (!gfx) {
      console.log("[ConnectionLabelStyling] No graphics found for element:", element.id);
      return;
    }
    console.log("[ConnectionLabelStyling] Graphics found, searching for label");

    // Find the label text element - search in the connection graphics and parent
    let labelText = gfx.querySelector(".djs-label");
    console.log("[ConnectionLabelStyling] Label in gfx:", labelText ? "found" : "not found");
    
    // If not found, try to find the label shape element for this connection
    if (!labelText) {
      // First, try direct lookup by label ID pattern
      const labelId = `${element.id}_label`;
      let labelElement = this._elementRegistry.get(labelId);
      
      if (labelElement) {
        console.log("[ConnectionLabelStyling] Found label element by direct ID lookup:", labelId);
      } else {
        // Labels are separate shape elements, find them by checking all label shapes
        const allElements = this._elementRegistry.getAll();
        console.log("[ConnectionLabelStyling] Searching for label element for connection:", element.id);
      
      allElements.forEach((el) => {
        const isLabel = el.type === "label" || 
                       (el.businessObject && typeof el.businessObject === 'object' && el.businessObject.$type === "bpmn:Label");
        
        if (isLabel) {
          // Check if this label belongs to our connection
          let host = el.host || el.parent;
          
          // Try extracting connection ID from label ID (pattern: {connectionId}_label)
          if (!host && el.id && el.id.endsWith("_label")) {
            const connectionId = el.id.replace(/_label$/, "");
            if (connectionId === element.id) {
              host = element;
              console.log("[ConnectionLabelStyling] Matched label by ID pattern:", el.id, "->", connectionId);
            }
          }
          
          // If no direct host, check businessObject relationship
          if (!host && el.businessObject && typeof el.businessObject === 'object') {
            const labelBO = el.businessObject;
            if (labelBO.$parent && labelBO.$parent === element.businessObject) {
              host = element;
              console.log("[ConnectionLabelStyling] Matched label by businessObject:", el.id);
            }
          }
          
          if (host && host.id === element.id) {
            labelElement = el;
            console.log("[ConnectionLabelStyling] Found label element for connection:", el.id);
          }
        }
      });
      }

      if (labelElement) {
        console.log("[ConnectionLabelStyling] Label element found, getting graphics");
        const labelGfx = this._elementRegistry.getGraphics(labelElement);
        if (labelGfx) {
          console.log("[ConnectionLabelStyling] Label graphics found, structure:", labelGfx.outerHTML ? labelGfx.outerHTML.substring(0, 300) : "no outerHTML");
          labelText = labelGfx.querySelector(".djs-label") || labelGfx.querySelector("text");
          console.log("[ConnectionLabelStyling] Label text found in label shape:", labelText ? "found" : "not found");
          
          // If still not found, search for text in the label graphics
          if (!labelText) {
            const allTexts = labelGfx.querySelectorAll("text");
            console.log("[ConnectionLabelStyling] Found", allTexts.length, "text elements in label graphics");
            allTexts.forEach((textEl, idx) => {
              console.log(`[ConnectionLabelStyling] Text element ${idx}:`, textEl.textContent, "parent:", textEl.parentNode?.className);
            });
            if (allTexts.length > 0) {
              labelText = allTexts[0];
              console.log("[ConnectionLabelStyling] Using first text element from label graphics");
            }
            
            // Also try finding text in nested groups
            if (!labelText) {
              const allGroups = labelGfx.querySelectorAll("g");
              console.log("[ConnectionLabelStyling] Found", allGroups.length, "groups in label graphics");
              allGroups.forEach((group, idx) => {
                const textInGroup = group.querySelector("text");
                if (textInGroup) {
                  console.log(`[ConnectionLabelStyling] Found text in group ${idx}:`, textInGroup.textContent);
                  if (!labelText) {
                    labelText = textInGroup;
                  }
                }
              });
            }
          }
        } else {
          console.log("[ConnectionLabelStyling] No graphics found for label element");
        }
      } else {
        console.log("[ConnectionLabelStyling] No label element found for connection");
      }
    }
    
    // If still not found, search in the canvas for labels associated with this connection
    if (!labelText) {
      const canvasRoot = this._canvas._svg;
      if (canvasRoot) {
        console.log("[ConnectionLabelStyling] Searching in canvas root for label");
        // Find label by data-element-id
        const labelGroup = canvasRoot.querySelector(
          `.djs-label[data-element-id="${element.id}"]`
        );
        if (labelGroup) {
          labelText = labelGroup.querySelector("text") || labelGroup;
          console.log("[ConnectionLabelStyling] Label found in canvas root");
        } else {
          // Try searching for any label with the element id
          const allLabels = canvasRoot.querySelectorAll(".djs-label");
          console.log("[ConnectionLabelStyling] Found", allLabels.length, "labels in canvas");
          allLabels.forEach((label, idx) => {
            const labelElementId = label.getAttribute("data-element-id");
            console.log(`[ConnectionLabelStyling] Label ${idx}: data-element-id="${labelElementId}"`);
            if (labelElementId === element.id) {
              labelText = label.querySelector("text") || label;
              console.log("[ConnectionLabelStyling] Matched label found");
            }
          });
        }
      } else {
        console.log("[ConnectionLabelStyling] Canvas root not found");
      }
    }

    if (!labelText) {
      console.log("[ConnectionLabelStyling] No label text found for element:", element.id);
      // Try to find label in different ways
      console.log("[ConnectionLabelStyling] GFX structure:", gfx.outerHTML ? gfx.outerHTML.substring(0, 200) : "no outerHTML");
      // Also try searching by element type
      const allTextElements = gfx.querySelectorAll("text");
      console.log("[ConnectionLabelStyling] Found", allTextElements.length, "text elements in gfx");
      allTextElements.forEach((textEl, idx) => {
        console.log(`[ConnectionLabelStyling] Text element ${idx}:`, textEl.textContent, "parent:", textEl.parentNode?.className);
      });
      // Check if label might be in a different structure
      const allGroups = gfx.querySelectorAll("g");
      console.log("[ConnectionLabelStyling] Found", allGroups.length, "group elements in gfx");
      allGroups.forEach((group, idx) => {
        const groupClass = group.getAttribute("class");
        const groupDataId = group.getAttribute("data-element-id");
        console.log(`[ConnectionLabelStyling] Group ${idx}: class="${groupClass}", data-element-id="${groupDataId}"`);
        if (groupClass && groupClass.includes("label")) {
          const textInGroup = group.querySelector("text");
          if (textInGroup) {
            console.log(`[ConnectionLabelStyling] Found text in label group ${idx}:`, textInGroup.textContent);
          }
        }
      });
      return;
    }
    
    console.log("[ConnectionLabelStyling] Label text found:", labelText.tagName, labelText.textContent);

    // Check if we've already processed this label
    const labelId = `${element.id}-label`;
    
    // Search for existing background in label graphics if we found a label element
    let existingBg = null;
    if (labelText && labelText.parentNode) {
      existingBg = labelText.parentNode.querySelector(
        `.connection-label-bg[data-label-id="${labelId}"]`
      );
    }
    
    // Also check in connection graphics and canvas root
    if (!existingBg) {
      existingBg = gfx.querySelector(
        `.connection-label-bg[data-label-id="${labelId}"]`
      ) || (this._canvas._svg && this._canvas._svg.querySelector(
        `.connection-label-bg[data-label-id="${labelId}"]`
      ));
    }

    if (existingBg) {
      console.log("[ConnectionLabelStyling] Existing background found, updating position and size");
      // Always update existing background (in case it moved or text changed)
      this._updateBackgroundRect(existingBg, labelText);
      // Make sure opacity is still 100%
      existingBg.setAttribute("fill-opacity", "1.0");
      return;
    }

    // Get text bounding box
    let bbox;
    try {
      bbox = labelText.getBBox();
      console.log("[ConnectionLabelStyling] Label bbox:", bbox.x, bbox.y, bbox.width, bbox.height);
    } catch (e) {
      console.log("[ConnectionLabelStyling] Error getting bbox:", e.message, "- retrying later");
      // Text might not be rendered yet, try again later
      setTimeout(() => {
        this._applyLabelBackground(element);
      }, 100);
      return;
    }

    // Only add background if text has content and valid dimensions
    const textContent = labelText.textContent || "";
    console.log("[ConnectionLabelStyling] Text content:", textContent.trim());
    if (!textContent.trim() || bbox.width === 0 || bbox.height === 0) {
      console.log("[ConnectionLabelStyling] Skipping - no text content or invalid dimensions");
      return;
    }

    // Create background rectangle
    const bgRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    bgRect.setAttribute("class", "connection-label-bg");
    bgRect.setAttribute("data-label-id", labelId);

    // Set background properties
    const padding = 3;
    bgRect.setAttribute("x", bbox.x - padding);
    bgRect.setAttribute("y", bbox.y - padding);
    bgRect.setAttribute("width", bbox.width + padding * 2);
    bgRect.setAttribute("height", bbox.height + padding * 2);
    bgRect.setAttribute("fill", "white");
    bgRect.setAttribute("fill-opacity", "1.0");
    bgRect.setAttribute("stroke", "none");
    bgRect.setAttribute("rx", "2");
    bgRect.setAttribute("ry", "2");

    // Insert before the text element so it appears behind
    const parent = labelText.parentNode;
    if (parent) {
      console.log("[ConnectionLabelStyling] Inserting background rectangle");
      parent.insertBefore(bgRect, labelText);
      this._processedLabels.add(labelId);
      console.log("[ConnectionLabelStyling] Background rectangle added successfully");

      // Update background when text changes or moves - use requestAnimationFrame for smooth updates
      const updateBackground = () => {
        try {
          const updatedBbox = labelText.getBBox();
          if (updatedBbox.width > 0 && updatedBbox.height > 0) {
            this._updateBackgroundRect(bgRect, labelText);
            // Ensure opacity stays at 100%
            bgRect.setAttribute("fill-opacity", "1.0");
          }
        } catch (e) {
          // Ignore errors during updates
        }
      };

      const observer = new MutationObserver(() => {
        requestAnimationFrame(updateBackground);
      });
      observer.observe(labelText, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['transform', 'x', 'y', 'style']
      });

      // Also observe the parent for transform changes (when label moves)
      if (labelText.parentNode) {
        const parentObserver = new MutationObserver(() => {
          requestAnimationFrame(updateBackground);
        });
        parentObserver.observe(labelText.parentNode, {
          attributes: true,
          attributeFilter: ['transform', 'style']
        });
        bgRect._parentObserver = parentObserver;
      }

      // Also observe the label graphics group for transform changes
      if (labelText.parentNode && labelText.parentNode.parentNode) {
        const groupObserver = new MutationObserver(() => {
          requestAnimationFrame(updateBackground);
        });
        groupObserver.observe(labelText.parentNode.parentNode, {
          attributes: true,
          attributeFilter: ['transform', 'style']
        });
        bgRect._groupObserver = groupObserver;
      }

      // Store observer for cleanup
      this._observers.set(labelId, observer);
    } else {
      console.log("[ConnectionLabelStyling] ERROR: No parent node found for label text");
    }
  } catch (error) {
    console.error("[ConnectionLabelStyling] ERROR in _applyLabelBackground:", error);
  }
};

// Update background rectangle size when text changes
ConnectionLabelStylingPlugin.prototype._updateBackgroundRect = function (
  bgRect,
  labelText
) {
  try {
    const bbox = labelText.getBBox();
    if (bbox.width === 0 || bbox.height === 0) {
      return;
    }
    const padding = 3;
    bgRect.setAttribute("x", bbox.x - padding);
    bgRect.setAttribute("y", bbox.y - padding);
    bgRect.setAttribute("width", bbox.width + padding * 2);
    bgRect.setAttribute("height", bbox.height + padding * 2);
  } catch (e) {
    // Ignore errors
  }
};

// Clean up label background and observer
ConnectionLabelStylingPlugin.prototype._cleanupLabel = function (element) {
  const labelId = `${element.id}-label`;
  this._processedLabels.delete(labelId);

  const observer = this._observers.get(labelId);
  if (observer) {
    observer.disconnect();
    this._observers.delete(labelId);
  }

  // Also clean up parent observer if it exists
  const labelElementId = `${element.id}_label`;
  const labelElement = this._elementRegistry.get(labelElementId);
  if (labelElement) {
    const labelGfx = this._elementRegistry.getGraphics(labelElement);
    if (labelGfx) {
      const bgRect = labelGfx.querySelector(`.connection-label-bg[data-label-id="${labelId}"]`);
      if (bgRect && bgRect._parentObserver) {
        bgRect._parentObserver.disconnect();
      }
    }
  }

  // Remove background rectangle
  const gfx = this._elementRegistry.getGraphics(element);
  if (gfx) {
    const bgRect = gfx.querySelector(
      `.connection-label-bg[data-label-id="${labelId}"]`
    );
    if (bgRect && bgRect.parentNode) {
      bgRect.parentNode.removeChild(bgRect);
    }
  }

  // Also check canvas root
  if (this._canvas._svg) {
    const bgRect = this._canvas._svg.querySelector(
      `.connection-label-bg[data-label-id="${labelId}"]`
    );
    if (bgRect && bgRect.parentNode) {
      bgRect.parentNode.removeChild(bgRect);
    }
  }
};

ConnectionLabelStylingPlugin.$inject = ["eventBus", "canvas", "elementRegistry"];

export default {
  __init__: ["connectionLabelStylingPlugin"],
  connectionLabelStylingPlugin: ["type", ConnectionLabelStylingPlugin],
};
