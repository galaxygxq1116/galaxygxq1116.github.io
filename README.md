# Xiaoqi Guo — Public website

This directory contains the complete public runtime source: four HTML pages, local CSS/JavaScript, icons and the images actually used by the website. No build or framework is required.

Upload these extracted files directly to the configured GitHub Pages repository root, including .nojekyll. Keep index.html at the root. Relative links support a repository subpath. This package has not been published for you.

Home uses the newly supplied illustration, resized to a 720×958 WebP. The old photographic portrait, cutouts, uploaded PNG, original-image folder, test screenshots, development documents and embedded previews are not included. The graduation lightbox uses the existing web-resolution illustration instead of its original PNG.

Modify index.html for Home content, experience.html for the timeline, assets/style.css for styles and assets/main.js for menu/viewer/clipboard behavior. The sticky navigation and edge arcs remain unchanged.

## Portrait frame update (v10)

Home now uses a warm beige, narrow arched mount and two short static contours. The illustration is unchanged and is not filtered or recolored. The frame decorations are CSS-only, ignore pointer input, and add no dependencies. Adjust the `.portrait-setting` rules in assets/style.css. No other page layout has changed.
