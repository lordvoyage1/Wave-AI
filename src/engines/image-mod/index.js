/**
 * Wave AI — Image Modification Engine Index (COMPLETE)
 */
export { ImageModificationCore, imageModCore } from "./core.js";
export { ImageFilters } from "./filters.js";
export { LayerManager, layerManager } from "./layerManager.js";
export { TextOverlayEngine, textOverlayEngine } from "./textOverlay.js";
export { ShapeDrawer } from "./shapeDrawer.js";
export { GradientEditor, GRADIENT_PRESETS } from "./gradientEditor.js";
export { BackgroundBlurEngine, backgroundBlurEngine } from "./backgroundBlur.js";
export { ColorReplacer, colorReplacer } from "./colorReplace.js";
export { ImageBatchProcessor, imageBatchProcessor } from "./batchProcessor.js";
export { ImagePresetManager, imagePresetManager, BUILT_IN_PRESETS } from "./presetManager.js";
export { AnnotationTool } from "./annotationTool.js";
export { CanvasHistoryManager, canvasHistoryManager } from "./canvasHistory.js";
export { ImageShareEngine, imageShareEngine } from "./imageShare.js";
export { ImageInfoAnalyzer, imageInfoAnalyzer } from "./imageInfo.js";
export { ZoomPanController } from "./zoomPan.js";
export { BorderEffectEngine, borderEffectEngine } from "./borderEffect.js";
export { StickerEngine, stickerEngine, EMOJI_STICKERS, TEXT_STICKERS } from "./stickerEngine.js";
export { GlowEffectEngine, glowEffectEngine } from "./glowEffect.js";
export { enhancePhoto, autoEnhance, getEnhancementSuggestions } from "./photoEnhancer.js";

export async function modifyImage(imageSource, operations = []) {
  const { ImageModificationCore } = await import("./core.js");
  const { ImageFilters } = await import("./filters.js");
  const editor = new ImageModificationCore();
  await editor.loadImage(imageSource);
  const filters = new ImageFilters(editor.canvas);
  for (const op of operations) {
    switch (op.type) {
      case "resize": editor.resize(op.width, op.height, op.maintainAspect); break;
      case "crop": editor.crop(op.x, op.y, op.width, op.height); break;
      case "rotate": editor.rotate(op.degrees); break;
      case "flipH": editor.flipHorizontal(); break;
      case "flipV": editor.flipVertical(); break;
      case "brightness": editor.adjustBrightness(op.amount); break;
      case "contrast": editor.adjustContrast(op.amount); break;
      case "filter": filters.applyFilter(op.filter, op.value); break;
    }
  }
  return { dataURL: editor.toDataURL(), blob: await editor.toBlob(), dimensions: editor.getDimensions() };
}
