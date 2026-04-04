import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
