import { Card, CardBody } from "@nextui-org/react";

import { ImageData } from "@/lib/types";

interface SidebarProps {
  images: ImageData[];
  selectedIndex: number | null;
  onSelectImage: (index: number) => void;
}

export default function Sidebar({
  images,
  selectedIndex,
  onSelectImage,
}: SidebarProps) {
  return (
    <Card>
      <CardBody>
        {images.map((image, index) => (
          <button
            key={image.name}
            className={`cursor-pointer mb-2 text-left w-full ${selectedIndex === index ? "font-bold" : ""}`}
            onClick={() => onSelectImage(index)}
          >
            {image.name} {image.caption ? "✓" : ""}
          </button>
        ))}
      </CardBody>
    </Card>
  );
}
