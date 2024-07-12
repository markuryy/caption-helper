import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@nextui-org/react";
import { LuCrop, LuCheck } from "react-icons/lu";

import { ImageData } from "@/lib/types";

interface ImageViewerProps {
  image: ImageData;
  onCrop: (croppedImageData: string) => void;
}

export default function ImageViewer({ image, onCrop }: ImageViewerProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();

      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0,
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return "";
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5,
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
      0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y,
    );

    return canvas.toDataURL("image/jpeg");
  };

  const handleCropClick = useCallback(async () => {
    if (isCropping && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(
          `data:image/jpeg;base64,${image.content}`,
          croppedAreaPixels,
        );

        onCrop(croppedImage.split(",")[1]);
        setIsCropping(false);
      } catch (e) {
        console.error(e);
      }
    } else {
      setIsCropping(true);
    }
  }, [isCropping, croppedAreaPixels, image.content, onCrop]);

  return (
    <div className="relative h-[300px]">
      {isCropping ? (
        <Cropper
          aspect={1}
          crop={crop}
          image={`data:image/jpeg;base64,${image.content}`}
          zoom={zoom}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      ) : (
        <img
          alt={image.name}
          className="w-full h-full object-contain"
          src={`data:image/jpeg;base64,${image.content}`}
        />
      )}
      <Button
        isIconOnly
        aria-label="Crop"
        className="absolute bottom-2 right-2"
        color="primary"
        onClick={handleCropClick}
      >
        {isCropping ? <LuCheck /> : <LuCrop />}
      </Button>
    </div>
  );
}
