import JSZip from "jszip";
import { ImageData } from "./types";

export async function processUploadedFiles(
  files: File[],
): Promise<ImageData[]> {
  const images: ImageData[] = [];
  const textFiles: { [key: string]: string } = {};

  for (const file of files) {
    if (file.type === "application/zip") {
      const zipImages = await processZipFile(file);

      images.push(...zipImages);
    } else if (file.type.startsWith("image/")) {
      const imageData = await processImageFile(file);

      images.push(imageData);
    } else if (file.type === "text/plain") {
      const content = await file.text();

      textFiles[file.name] = content;
    }
  }

  // Match text files with images
  images.forEach((image) => {
    const baseName = image.name.replace(/\.[^/.]+$/, "");
    const txtFileName = `${baseName}.txt`;

    if (textFiles[txtFileName]) {
      image.caption = textFiles[txtFileName];
    }
  });

  return images;
}

async function processZipFile(file: File): Promise<ImageData[]> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  const images: ImageData[] = [];

  for (const [filename, zipEntry] of Object.entries(contents.files)) {
    if (zipEntry.dir) continue;

    if (filename.match(/\.(jpe?g|png|gif|bmp)$/i)) {
      const content = await zipEntry.async("base64");
      const caption = await getCaptionFromZip(contents, filename);

      images.push({ name: filename, content, caption });
    }
  }

  return images;
}

async function getCaptionFromZip(
  contents: JSZip,
  imageName: string,
): Promise<string> {
  const baseName = imageName.replace(/\.[^/.]+$/, "");
  const txtFile = contents.file(baseName + ".txt");

  return txtFile ? await txtFile.async("string") : "";
}

async function processImageFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = (e.target?.result as string).split(",")[1]; // Remove data URL prefix

      resolve({ name: file.name, content, caption: "" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function exportImagesAndCaptions(
  images: ImageData[],
  includeImages: boolean,
): Promise<Blob> {
  const zip = new JSZip();

  images.forEach((image, index) => {
    const baseName = image.name.split(".")[0];

    if (includeImages) {
      zip.file(`${baseName}.jpg`, image.content, { base64: true });
    }
    zip.file(`${baseName}.txt`, image.caption);
  });

  return zip.generateAsync({ type: "blob" });
}
