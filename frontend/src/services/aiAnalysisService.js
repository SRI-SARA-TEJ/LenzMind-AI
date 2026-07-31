/**
 * Sends a locally captured camera image to the backend AI analysis endpoint.
 * This service deliberately owns HTTP concerns only; camera state remains in
 * CameraContext and frame extraction remains in CameraPreview.
 */

const ANALYZE_IMAGE_ENDPOINT = '/api/ai/analyze-image';

export async function analyzeCapturedImage(blob) {
  if (!(blob instanceof Blob)) {
    throw new Error('A captured image Blob is required for analysis.');
  }

  const formData = new FormData();
  formData.append('image', blob, 'captured-photo.jpg');

  const response = await fetch(ANALYZE_IMAGE_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Image analysis could not be completed.');
  }

  return payload.analysis;
}
