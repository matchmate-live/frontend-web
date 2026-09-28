import type { NSFWJS } from "nsfwjs/core";

/** Combined Porn + Hentai probability at or above which a photo is rejected as explicit. */
const EXPLICIT_THRESHOLD = 0.6;
/** "Sexy" also covers swimwear/lingerie, so only reject when the model is very sure —
 * lower this if suggestive photos become a problem, raise it if users hit false positives. */
const SUGGESTIVE_THRESHOLD = 0.95;

/** "explicit" = nudity / sexual content (incl. drawn); "suggestive" = too revealing. */
export type PhotoIssue = "explicit" | "suggestive";

let modelPromise: Promise<NSFWJS> | null = null;

/** Loaded lazily (and only once per page) — TensorFlow.js + the bundled MobileNetV2 model
 * are a few MB, so nothing is downloaded until someone actually saves photos. Only the
 * smallest model is registered via `nsfwjs/core` so the other two aren't bundled. */
function loadModel(): Promise<NSFWJS> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [{ load }, { MobileNetV2Model }] = await Promise.all([
        import("nsfwjs/core"),
        import("nsfwjs/models/mobilenet_v2"),
      ]);
      return load("MobileNetV2", { modelDefinitions: [MobileNetV2Model] });
    })();
    // Let a later call retry instead of caching the failure forever.
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

/**
 * Client-side screen for explicit photos, run before anything is uploaded. This is a
 * first line of defence for honest users, not enforcement — anyone can bypass browser
 * code and PUT to the presigned URL directly, so user reports / admin review still matter.
 *
 * Fails open: if the model can't load or run (old browser, no WebGL and slow CPU fallback
 * erroring, etc.) the photo is allowed rather than blocking legitimate uploads.
 *
 * Returns why the photo was rejected, or null if it's fine. The model only scores whole-image
 * categories, so this is as specific as it can get — it can't say *what* in the photo is wrong.
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

    // Explicit is checked first: a photo that trips both should get the stronger reason.
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
