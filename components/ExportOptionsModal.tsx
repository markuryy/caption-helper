import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
  Input,
} from "@nextui-org/react";

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
}

export interface ExportOptions {
  includeImages: boolean;
  renameSequentially: boolean;
  prefix: string;
}

export default function ExportOptionsModal({
  isOpen,
  onClose,
  onExport,
}: ExportOptionsModalProps) {
  const [includeImages, setIncludeImages] = useState(true);
  const [renameSequentially, setRenameSequentially] = useState(false);
  const [prefix, setPrefix] = useState("image");

  const handleExport = () => {
    onExport({ includeImages, renameSequentially, prefix });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Export Options</ModalHeader>
        <ModalBody>
          <Switch isSelected={includeImages} onValueChange={setIncludeImages}>
            Include images in export
          </Switch>
          <Switch
            isSelected={renameSequentially}
            onValueChange={setRenameSequentially}
          >
            Rename images sequentially
          </Switch>
          {renameSequentially && (
            <Input
              label="File name prefix"
              placeholder="Enter prefix for file names"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleExport}>
            Export
          </Button>
          <Button color="secondary" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
