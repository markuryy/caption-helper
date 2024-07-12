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
} from "@nextui-org/react";
import { LuInfo } from "react-icons/lu";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const [groqApiKey, setGroqApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");

  useEffect(() => {
    const savedGroqApiKey = localStorage.getItem("groqApiKey");
    const savedOpenaiApiKey = localStorage.getItem("openaiApiKey");

    if (savedGroqApiKey) setGroqApiKey(savedGroqApiKey);
    if (savedOpenaiApiKey) setOpenaiApiKey(savedOpenaiApiKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem("groqApiKey", groqApiKey);
    localStorage.setItem("openaiApiKey", openaiApiKey);
    onClose();
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
            <Tooltip content="Used for GPT-4o image interrogation">
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
