import { Textarea } from "@nextui-org/react";

interface CaptionEditorProps {
  caption: string;
  onChange: (caption: string) => void;
}

export default function CaptionEditor({
  caption,
  onChange,
}: CaptionEditorProps) {
  return (
    <Textarea
      label="Caption"
      rows={5}
      value={caption}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
