// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

// Provide a minimal canvas 2d context so components using measureText (e.g. Combobox) work in jsdom.
HTMLCanvasElement.prototype.getContext = function () {
  return {
    measureText: (text) => ({ width: text.length * 8 }),
    fillText: () => {},
    clearRect: () => {},
    fillRect: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    font: '',
    textAlign: '',
    textBaseline: '',
  };
};
