import * as FileSystem from "expo-file-system";



/**
 * Unwrap a cylindrical label from a recorded video by delegating to a backend service.
 * Returns a path to the flattened image written to the cache directory.
 */
export async function unwrapCylindricalLabel(videoUri: string): Promise<string[]> {
  console.log("Unwrapping cylindrical label from video:", videoUri);
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: videoUri,
      name: "label.mp4",
      type: "video/mp4",
    } as any);

    const response = await fetch(`http://192.168.1.220:5050/unwrap`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Unwrap request failed");
    }

    const res = await response.json();
    const { ocrBestFrameUrl, frames, sheetUrl, ocrSheetUrl } = res;
    if (!sheetUrl) {
      throw new Error("No sheetUrl returned");
    }

    const localuris = await Promise.all(frames.map(async (frame: any) => {
      console.log("Processing frame:", frame);
      const localUri = `${FileSystem.cacheDirectory}frame_${Date.now()}.jpg`;
      const { uri } = await FileSystem.downloadAsync(frame, localUri);
      return uri;
    }));

  // Collect optional single-image URLs, filter falsy, then download them too
  const singles = [ocrBestFrameUrl, sheetUrl, ocrSheetUrl].filter(
    (u): u is string => typeof u === "string" && u.length > 0
  );

  const singleUris = await Promise.all(
    singles.map(async (url, i) => {
      const target = `${FileSystem.cacheDirectory}single_${Date.now()}_${i}.jpg`;
      const { uri } = await FileSystem.downloadAsync(url, target);
      return uri;
    })
  );

  // Only strings go out
  const allUris: string[] = [...localuris, ...singleUris];
  console.log("Unwrap produced URIs:", allUris);
  return allUris;
  } catch (err) {
    console.error("cylindrical unwrap failed", err);
    throw err;
  }
}
