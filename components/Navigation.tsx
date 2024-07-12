import { Button } from "@nextui-org/react";

interface NavigationProps {
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function Navigation({
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: NavigationProps) {
  return (
    <div className="flex justify-center space-x-4 mt-4">
      <Button disabled={!hasPrev} onClick={onPrev}>
        Previous
      </Button>
      <Button disabled={!hasNext} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}
