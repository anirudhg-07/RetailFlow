// This is file of your component
// You can use any dependencies from npm; we import them automatically in package.json

import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Component() {
  const [count, setCount] = useState(0);

  return (
    <div className={cn("min-h-screen w-full bg-[#fff8f0] relative")}>
      {/* Soft Warm Pastel Texture */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        radial-gradient(circle at 20% 80%, rgba(255, 182, 153, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 244, 214, 0.5) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(255, 182, 153, 0.1) 0%, transparent 50%)`,
        }}
      />
      {/* Your Content/Components */}
      <div className="relative z-10 p-6">Demo</div>
    </div>
  );
}
