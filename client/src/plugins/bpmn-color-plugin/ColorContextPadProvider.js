/**
 * A context pad provider that adds color picker functionality to BPMN elements
 */
export default function ColorContextPadProvider(contextPad, injector) {
  this._contextPad = contextPad;
  this._injector = injector;

  contextPad.registerProvider(this);
}

ColorContextPadProvider.$inject = ["contextPad", "injector"];

ColorContextPadProvider.prototype.getContextPadEntries = function (element) {
  const colorManagement = this._injector.get("colorManagementPlugin", false);

  if (!colorManagement) {
    return {};
  }

  // Only show color picker for supported elements
  if (!colorManagement.standardColors[element.type]) {
    return {};
  }

  return {
    "color-picker": {
      group: "edit",
      className: "color-picker-entry",
      title: "Change Color",
      action: {
        click: function (event) {
          colorManagement._showColorPicker(element, event);
        },
      },
    },
  };
};
