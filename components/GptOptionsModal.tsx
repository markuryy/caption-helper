import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from "@nextui-org/react";

interface GptOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (options: GptOptions) => void;
}

export interface GptOptions {
  customToken: string;
  customInstruction: string;
  inherentAttributes: string;
}

export default function GptOptionsModal({
  isOpen,
  onClose,
  onApply,
}: GptOptionsModalProps) {
  const [customToken, setCustomToken] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [inherentAttributes, setInherentAttributes] = useState("");

  useEffect(() => {
    // Load saved options from localStorage
    const savedOptions = localStorage.getItem("gptOptions");

    if (savedOptions) {
      const { customToken, customInstruction, inherentAttributes } =
        JSON.parse(savedOptions);

      setCustomToken(customToken || "");
      setCustomInstruction(customInstruction || "");
      setInherentAttributes(inherentAttributes || "");
    }
  }, []);

  const handleApply = () => {
    const options = { customToken, customInstruction, inherentAttributes };

    localStorage.setItem("gptOptions", JSON.stringify(options));
    onApply(options);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>GPT Captioning Options</ModalHeader>
        <ModalBody>
          <Input
            label="Custom Token (Recommended but optional)"
            placeholder="Enter custom token"
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
          />
          <Textarea
            label="Custom Instruction (Optional)"
            placeholder="Enter custom instruction"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
          />
          <Textarea
            label="Inherent Attributes (Optional)"
            placeholder="Enter inherent attributes to avoid"
            value={inherentAttributes}
            onChange={(e) => setInherentAttributes(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleApply}>
            Apply
          </Button>
          <Button color="secondary" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
