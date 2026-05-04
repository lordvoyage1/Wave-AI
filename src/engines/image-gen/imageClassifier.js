/**
 * Wave AI — Image Generation — Image Classifier
 * Classify images using HuggingFace models.
 */
export async function classifyImage(imageBlob, apiKey) {
  if (!apiKey) return { success: false, labels: [{ label: "image", score: 1.0 }] };
  try {
    const arrayBuffer = await imageBlob.arrayBuffer();
    const response = await fetch("https://api-inference.huggingface.co/models/google/vit-base-patch16-224", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
      body: arrayBuffer,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const labels = await response.json();
    return { success: true, labels: Array.isArray(labels) ? labels : [] };
  } catch (err) {
    return { success: false, error: err.message, labels: [] };
  }
}

export async function detectObjects(imageBlob, apiKey) {
  if (!apiKey) return { success: false, objects: [] };
  try {
    const arrayBuffer = await imageBlob.arrayBuffer();
    const response = await fetch("https://api-inference.huggingface.co/models/facebook/detr-resnet-50", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
      body: arrayBuffer,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const objects = await response.json();
    return { success: true, objects: Array.isArray(objects) ? objects : [] };
  } catch (err) {
    return { success: false, error: err.message, objects: [] };
  }
}

export function getImageDescription(labels = [], objects = []) {
  const topLabels = labels.slice(0, 3).map(l => l.label).join(", ");
  const topObjects = objects.slice(0, 5).map(o => o.label).join(", ");
  if (!topLabels && !topObjects) return "Image content could not be determined.";
  let desc = "This image appears to contain: ";
  if (topLabels) desc += topLabels;
  if (topObjects && topObjects !== topLabels) desc += (topLabels ? "; objects detected: " : "") + topObjects;
  return desc + ".";
}
