// Utility function to convert blob to base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob); // Convert the blob to base64
    reader.onloadend = () => resolve(reader.result as string); // Return base64 image string
    reader.onerror = (error) => reject(error);
  });
}
