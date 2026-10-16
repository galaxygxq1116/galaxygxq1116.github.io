/* Pure geometry shared by the classic-script viewer and offline Node tests. */
const ViewerMath = Object.freeze({
  fit(width, height, viewportWidth, viewportHeight) {
    if ([width, height, viewportWidth, viewportHeight].some(value => !(value > 0))) return 1;
    return Math.min(1, viewportWidth / width, viewportHeight / height);
  },
  clamp(value, minimum) {
    return Math.min(1, Math.max(minimum, value));
  },
  layout(width, height, zoom, viewportWidth, viewportHeight) {
    const imageWidth = width * zoom, imageHeight = height * zoom;
    const canvasWidth = Math.max(viewportWidth, imageWidth);
    const canvasHeight = Math.max(viewportHeight, imageHeight);
    return { imageWidth, imageHeight, canvasWidth, canvasHeight,
      offsetX: (canvasWidth - imageWidth) / 2, offsetY: (canvasHeight - imageHeight) / 2,
      viewportWidth, viewportHeight };
  },
  anchoredScroll(oldLayout, newLayout, oldZoom, newZoom, left, top, anchorX, anchorY) {
    const x = (left + anchorX - oldLayout.offsetX) / oldZoom;
    const y = (top + anchorY - oldLayout.offsetY) / oldZoom;
    return {
      left: Math.max(0, Math.min(newLayout.canvasWidth - newLayout.viewportWidth,
        newLayout.offsetX + x * newZoom - anchorX)),
      top: Math.max(0, Math.min(newLayout.canvasHeight - newLayout.viewportHeight,
        newLayout.offsetY + y * newZoom - anchorY))
    };
  }
});
