import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@nextui-org/react";
import { LuInfo } from "react-icons/lu";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const [groqApiKey, setGroqApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [ollamaEndpoint, setOllamaEndpoint] = useState("");
  const [selectedModel, setSelectedModel] = useState({
    llmProvider: "",
    name: "",
  });
  const [ollamaModels, setOllamaModels] = useState([]);
  const [openaiModels, setOpenaiModels] = useState([]);

  useEffect(() => {
    const savedGroqApiKey = localStorage.getItem("groqApiKey");
    const savedOpenaiApiKey = localStorage.getItem("openaiApiKey");
    const savedOllamaEndpoint = localStorage.getItem("ollamaEndpoint");
    const savedSelectedModel = localStorage.getItem("selectedModel");

    if (savedGroqApiKey) setGroqApiKey(savedGroqApiKey);
    if (savedOpenaiApiKey) setOpenaiApiKey(savedOpenaiApiKey);
    if (savedOllamaEndpoint) setOllamaEndpoint(savedOllamaEndpoint);
    if (savedSelectedModel) setSelectedModel(JSON.parse(savedSelectedModel));
    if (
      (savedOpenaiApiKey || savedOllamaEndpoint) &&
      openaiModels.length === 0 &&
      ollamaModels.length === 0
    )
      handleFetchModels();
  }, []);

  const handleSave = () => {
    localStorage.setItem("groqApiKey", groqApiKey);
    localStorage.setItem("openaiApiKey", openaiApiKey);
    localStorage.setItem("ollamaEndpoint", ollamaEndpoint);
    localStorage.setItem("selectedModel", JSON.stringify(selectedModel));
    onClose();
  };

  const handleFetchModels = async () => {
    if (openaiModels.length === 0 && ollamaModels.length === 0) {
      try {
        const response = await fetch("/api/available-models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            openaiApiKey: openaiApiKey,
            ollamaEndpoint: ollamaEndpoint,
          }),
        });

        const data = await response.json();

        setOpenaiModels(data.openai || []);
        setOllamaModels(data.ollama || []);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalBody>
          <div className="flex items-center mb-4">
            <Input
              className="flex-grow"
              label="Groq API Key"
              type="password"
              value={groqApiKey}
              onChange={(e) => setGroqApiKey(e.target.value)}
            />
            <Tooltip content="Used for enhancing and extending captions">
              <LuInfo className="ml-2 cursor-help" />
            </Tooltip>
          </div>
          <p className="text-sm mb-4">
            Don&apos;t have a Groq API key? Get one&nbsp;
            <a
              className="text-blue-500 hover:underline"
              href="https://console.groq.com/keys"
              rel="noopener noreferrer"
              target="_blank"
            >
              here
            </a>
            .
          </p>
          <div className="flex items-center mb-4">
            <Input
              className="flex-grow"
              label="OpenAI API Key"
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
            />
            <Tooltip content="Used for image interrogation">
              <LuInfo className="ml-2 cursor-help" />
            </Tooltip>
          </div>
          <p className="text-sm mb-4">
            Don&apos;t have an OpenAI API key? Get one&nbsp;
            <a
              className="text-blue-500 hover:underline"
              href="https://platform.openai.com/api-keys"
              rel="noopener noreferrer"
              target="_blank"
            >
              here
            </a>
            .
          </p>
          <div className="flex items-center mb-4">
            <Input
              className="flex-grow"
              label="Ollama API Endpoint"
              placeholder="http://localhost:11434"
              type="url"
              value={ollamaEndpoint}
              onChange={(e) => setOllamaEndpoint(e.target.value)}
            />
            <Tooltip content="Used for Ollama image interrogation">
              <LuInfo className="ml-2 cursor-help" />
            </Tooltip>
          </div>
          <p className="text-sm mb-4">
            The Ollama server can be started by running &apos;ollama
            serve&apos;.
          </p>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered" onClick={handleFetchModels}>
                {selectedModel.name || "Select Interrogation Model"}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              style={{ maxHeight: "600px", overflowY: "auto" }}
              title="Available Models"
            >
              <DropdownSection showDivider title="OpenAi Models">
                {openaiModels.map((model) => (
                  <DropdownItem
                    key={model}
                    onClick={() =>
                      setSelectedModel({ llmProvider: "openai", name: model })
                    }
                  >
                    {model}
                  </DropdownItem>
                ))}
              </DropdownSection>
              <DropdownSection showDivider title="Ollama Models">
                {ollamaModels.map((model) => (
                  <DropdownItem
                    key={model}
                    onClick={() =>
                      setSelectedModel({ llmProvider: "ollama", name: model })
                    }
                  >
                    {model}
                  </DropdownItem>
                ))}
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleSave}>
            Save
          </Button>
          <Button color="secondary" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
