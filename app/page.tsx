// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Button } from "@nextui-org/react";
import { useDropzone } from "react-dropzone";
import { Toaster, toast } from "sonner";
import {
  LuSparkles,
  LuPlus,
  LuBrainCircuit,
  LuSettings,
  LuUndo,
  LuDownload,
  LuTrash2,
} from "react-icons/lu";

import Sidebar from "@/components/Sidebar";
import ImageViewer from "@/components/ImageViewer";
import CaptionEditor from "@/components/CaptionEditor";
import Navigation from "@/components/Navigation";
import Settings from "@/components/Settings";
import GptOptionsModal, { GptOptions } from "@/components/GptOptionsModal";
import ExportOptionsModal, {
  ExportOptions,
} from "@/components/ExportOptionsModal";
import { ImageData } from "@/lib/types";
import { processUploadedFiles, exportImagesAndCaptions } from "@/lib/utils";

export default function Home() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGptOptionsOpen, setIsGptOptionsOpen] = useState(false);
  const [isExportOptionsOpen, setIsExportOptionsOpen] = useState(false);
  const [previousCaptions, setPreviousCaptions] = useState<string[]>([]);
  const [gptOptions, setGptOptions] = useState<GptOptions>({
    customToken: "",
    customInstruction: "",
    inherentAttributes: "",
  });
  const [isLoading, setIsLoading] = useState({
    enhance: false,
    extend: false,
    interrogate: false,
    export: false,
  });

  useEffect(() => {
    const savedGroqApiKey = localStorage.getItem("groqApiKey");
    const savedOpenaiApiKey = localStorage.getItem("openaiApiKey");
    const savedOllamaEndpoint = localStorage.getItem("ollamaEndpoint");

    if (!savedGroqApiKey || !savedOpenaiApiKey || !savedOllamaEndpoint) {
      setIsSettingsOpen(true);
    }
  }, []);

  const onDrop = async (acceptedFiles: File[]) => {
    const newImages = await processUploadedFiles(acceptedFiles);

    setImages((prevImages) => [...prevImages, ...newImages]);
    if (selectedIndex === null && newImages.length > 0) {
      setSelectedIndex(images.length);
    }
    toast.success(`${newImages.length} images uploaded successfully`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleCaptionChange = (caption: string) => {
    if (selectedIndex !== null) {
      setImages((prevImages) =>
        prevImages.map((img, index) =>
          index === selectedIndex ? { ...img, caption } : img,
        ),
      );
    }
  };

  const handleNavigation = (direction: "prev" | "next") => {
    if (selectedIndex === null) return;
    const newIndex =
      direction === "prev" ? selectedIndex - 1 : selectedIndex + 1;

    if (newIndex >= 0 && newIndex < images.length) {
      setSelectedIndex(newIndex);
    }
  };

  const handleExport = async (options: ExportOptions) => {
    setIsLoading((prev) => ({ ...prev, export: true }));
    try {
      let exportImages = images;

      if (options.renameSequentially) {
        exportImages = images.map((img, index) => ({
          ...img,
          name: `${options.prefix}${(index + 1).toString().padStart(3, "0")}`,
        }));
      }
      const blob = await exportImagesAndCaptions(
        exportImages,
        options.includeImages,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "captions.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Captions exported as ZIP file");
    } catch (error) {
      toast.error("Failed to export captions");
    } finally {
      setIsLoading((prev) => ({ ...prev, export: false }));
    }
  };

  const handleCaptionAction = async (
    action: "enhance" | "extend" | "interrogate",
  ) => {
    if (selectedIndex === null) return;

    setIsLoading((prev) => ({ ...prev, [action]: true }));

    const groqApiKey = localStorage.getItem("groqApiKey");
    const openaiApiKey = localStorage.getItem("openaiApiKey") || "";
    const ollamaEndpoint = localStorage.getItem("ollamaEndpoint") || "";
    const selectedModel = JSON.parse(
      localStorage.getItem("selectedModel") || "{}",
    );

    const checkApiKeys = () => {
      if (!groqApiKey && action !== "interrogate") {
        toast.error("Groq API key not found. Please add it in the settings.");

        return false;
      }

      if (action === "interrogate" && !openaiApiKey && !ollamaEndpoint) {
        toast.error(
          "OpenAI API key or Ollama endpoint not found. Please add atleast one in the settings.",
        );

        return false;
      }

      return true;
    };

    if (!checkApiKeys()) {
      setIsLoading((prev) => ({ ...prev, [action]: false }));

      return;
    }

    const currentCaption = images[selectedIndex].caption;

    setPreviousCaptions([...previousCaptions, currentCaption]);

    try {
      let response;

      if (action === "interrogate") {
        let apiEndpoint = "gpt-interrogate";

        if (selectedModel.llmProvider == "ollama") {
          apiEndpoint = "ollama-interrogate";
        }

        response = await fetch(`/api/${apiEndpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: images[selectedIndex].content,
            apiKey: openaiApiKey || "",
            ollamaEndpoint: ollamaEndpoint,
            selectedModel: selectedModel.name,
            currentCaption,
            ...gptOptions,
          }),
        });
      } else {
        response = await fetch(`/api/groq-${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `${action === "enhance" ? "Enhance" : "Extend"} this image caption: ${currentCaption}`,
              },
            ],
            apiKey: groqApiKey,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} caption`);
      }

      const { content, caption } = data;

      handleCaptionChange(action === "interrogate" ? caption : content);
      toast.success(`Caption ${action}d successfully`);
    } catch (error) {
      console.error(`Error ${action}ing caption:`, error);
      let errorMessage = `Failed to ${action} caption`;
      let errorCode = "UNKNOWN_ERROR";

      if (error instanceof Error) {
        errorMessage = error.message;
        if ("code" in error) {
          errorCode = (error as any).code;
        }
      }

      toast.error(
        <div>
          <p>{errorMessage}</p>
          <p>Error Code: {errorCode}</p>
        </div>,
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, [action]: false }));
    }
  };

  const handleUndoCaption = () => {
    if (previousCaptions.length > 0) {
      const lastCaption = previousCaptions.pop();

      if (lastCaption && selectedIndex !== null) {
        handleCaptionChange(lastCaption);
        setPreviousCaptions([...previousCaptions]);
      }
    }
  };

  const handleCropImage = (croppedImageData: string) => {
    if (selectedIndex !== null) {
      setImages((prevImages) =>
        prevImages.map((img, index) =>
          index === selectedIndex ? { ...img, content: croppedImageData } : img,
        ),
      );
      toast.success("Image cropped successfully");
    }
  };

  const handleDeleteImage = () => {
    if (selectedIndex !== null) {
      const newImages = images.filter((_, index) => index !== selectedIndex);

      setImages(newImages);
      if (newImages.length === 0) {
        setSelectedIndex(null);
      } else if (selectedIndex >= newImages.length) {
        setSelectedIndex(newImages.length - 1);
      }
      toast.success("Image deleted successfully");
    }
  };

  return (
    <section className="flex flex-col items-center justify-center p-4">
      <Toaster />
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <GptOptionsModal
        isOpen={isGptOptionsOpen}
        onApply={setGptOptions}
        onClose={() => setIsGptOptionsOpen(false)}
      />
      <ExportOptionsModal
        isOpen={isExportOptionsOpen}
        onClose={() => setIsExportOptionsOpen(false)}
        onExport={handleExport}
      />
      <div className="w-full max-w-7xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Caption Helper</h1>
          <div className="flex space-x-2">
            <Button
              startContent={<LuBrainCircuit />}
              onClick={() => setIsGptOptionsOpen(true)}
            >
              GPT Options
            </Button>
            <Button
              startContent={<LuSettings />}
              onClick={() => setIsSettingsOpen(true)}
            >
              Settings
            </Button>
            <Button
              isLoading={isLoading.export}
              startContent={<LuDownload />}
              onClick={() => setIsExportOptionsOpen(true)}
            >
              Export
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/4">
            <div
              {...getRootProps()}
              className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer mb-4 ${isDragActive ? "border-primary" : "border-gray-300"}`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <p>Drag and drop some files here, or click to select files</p>
              )}
            </div>
            <Sidebar
              images={images}
              selectedIndex={selectedIndex}
              onSelectImage={setSelectedIndex}
            />
          </div>
          <div className="w-full md:w-3/4">
            {selectedIndex !== null ? (
              <Card>
                <CardBody className="flex flex-col md:flex-row p-4">
                  <div className="w-full md:w-1/2 pr-4 mb-4 md:mb-0">
                    <ImageViewer
                      image={images[selectedIndex]}
                      onCrop={handleCropImage}
                    />
                    <div className="flex justify-end mt-2 mr-2">
                      <Button
                        isIconOnly
                        color="danger"
                        startContent={<LuTrash2 />}
                        onClick={handleDeleteImage}
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 pl-4 flex flex-col">
                    <CaptionEditor
                      caption={images[selectedIndex].caption}
                      onChange={handleCaptionChange}
                    />
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button
                        isLoading={isLoading.enhance}
                        size="sm"
                        startContent={<LuSparkles />}
                        onClick={() => handleCaptionAction("enhance")}
                      >
                        Enhance
                      </Button>
                      <Button
                        isLoading={isLoading.extend}
                        size="sm"
                        startContent={<LuPlus />}
                        onClick={() => handleCaptionAction("extend")}
                      >
                        Extend
                      </Button>
                      <Button
                        isLoading={isLoading.interrogate}
                        size="sm"
                        startContent={<LuBrainCircuit />}
                        onClick={() => handleCaptionAction("interrogate")}
                      >
                        Interrogate
                      </Button>
                      <Button
                        disabled={previousCaptions.length === 0}
                        size="sm"
                        startContent={<LuUndo />}
                        onClick={handleUndoCaption}
                      >
                        Undo
                      </Button>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <Navigation
                        hasNext={selectedIndex < images.length - 1}
                        hasPrev={selectedIndex > 0}
                        onNext={() => handleNavigation("next")}
                        onPrev={() => handleNavigation("prev")}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <p className="text-center">
                No image selected. Upload an image or select one from the
                sidebar.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
