"use client";

import { ChatInterface } from "@/components/ChatInterface";
import { Toaster } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type ModelProvider = "deepseek" | "qwen" | "doubao";

export default function Chat() {
  const [modelProvider, setModelProvider] = useState<ModelProvider>("doubao");

  const handleModelChange = (model: ModelProvider) => {
    setModelProvider(model);
  };

  return (
    <main>
      <ChatInterface modelProvider={modelProvider} />
      <div className="absolute bottom-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[150px]">
              {modelProvider}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleModelChange("deepseek")}>
              Deepseek
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModelChange("qwen")}>
              千问
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModelChange("doubao")}>
              豆包
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Toaster />
    </main>
  );
}
