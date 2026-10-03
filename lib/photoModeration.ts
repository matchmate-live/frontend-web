import type { NSFWJS } from "nsfwjs/core";

// Porn + Hentai score at which a photo counts as explicit.
const EXPLICIT_THRESHOLD = 0.6;
// "Sexy" also catches swimwear, so only reject when the model is very sure. Lower it if
// suggestive photos get through, raise it if normal photos get rejected.
const SUGGESTIVE_THRESHOLD = 0.95;

// explicit: nudity or sexual content. suggestive: too revealing.
export type PhotoIssue = "explicit" | "suggestive";

let modelPromise: Promise<NSFWJS> | null = null;

// The model is a few MB, so it's only loaded the first time someone saves photos.
// Only the smallest model is included.
function loadModel(): Promise<NSFWJS> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [{ load }, { MobileNetV2Model }] = await Promise.all([
        import("nsfwjs/core"),
        import("nsfwjs/models/mobilenet_v2"),
      ]);
      return load("MobileNetV2", { modelDefinitions: [MobileNetV2Model] });
    })();
    // Don't cache a failed load, let the next call retry.
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

/**
 * Checks a photo for explicit content before upload. Returns the reason it's rejected,
 * or null if it's fine.
 * This runs in the browser, so it can be bypassed; reports and review still matter.
 * If the model can't load or run, the photo is allowed.
 */
export async function findPhotoIssue(image: Blob): Promise<PhotoIssue | null> {
  let bitmap: ImageBitmap | null = null;
  try {
    const model = await loadModel();
    bitmap = await createImageBitmap(image);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);

    const predictions = await model.classify(canvas);
    const score = (name: string) =>
      predictions.find((p) => p.className === name)?.probability ?? 0;

    // Check explicit first so the stronger reason wins.
    if (score("Porn") + score("Hentai") >= EXPLICIT_THRESHOLD) return "explicit";
    if (score("Sexy") >= SUGGESTIVE_THRESHOLD) return "suggestive";
    return null;
  } catch (err) {
    console.warn("Photo moderation check failed; allowing photo.", err);
    return null;
  } finally {
    bitmap?.close();
  }
}
