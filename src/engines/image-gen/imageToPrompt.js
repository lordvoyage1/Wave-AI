/**
 * Wave AI — Image Generation — Image to Prompt
 * Reverse-engineer prompts from images using HuggingFace.
 */
export async function imageToPrompt(imageBlob, apiKey) {
  if (!apiKey) return { success: false, prompt: "A detailed, high-quality image" };
  try {
    const ab = await imageBlob.arrayBuffer();
    const response = await fetch("https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "image/jpeg" },
      body: ab,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    const caption = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;
    return { success: true, prompt: caption || "A beautiful detailed image", raw: result };
  } catch (err) {
    return { success: false, error: err.message, prompt: "A detailed artistic image" };
  }
}

export async function analyzeImageContent(imageBlob, question, apiKey) {
  if (!apiKey) return { success: false, answer: "Cannot analyze without API key" };
  try {
    const form = new FormData();
    form.append("inputs", JSON.stringify({ question, image: await imageBlob.arrayBuffer() }));
    const response = await fetch("https://api-inference.huggingface.co/models/dandelin/vilt-b32-finetuned-vqa", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
      body: form,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return { success: true, answer: Array.isArray(result) ? result[0]?.answer : result.answer };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
