import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Paperclip } from "lucide-react";

interface ChatAttachmentProps {
  attachmentUrl: string;
  attachmentName: string | null;
  attachmentType: string | null;
}

export default function ChatAttachment({ 
  attachmentUrl, 
  attachmentName, 
  attachmentType 
}: ChatAttachmentProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadSignedUrl();
  }, [attachmentUrl]);

  const loadSignedUrl = async () => {
    const { data } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(attachmentUrl, 3600);
    if (data?.signedUrl) {
      setSignedUrl(data.signedUrl);
    }
  };

  if (!signedUrl || !attachmentType) {
    return (
      <div className="flex items-center gap-2 p-2 bg-background/10 rounded">
        <Paperclip className="h-3 w-3" />
        <span className="text-xs truncate">{attachmentName || "Cargando..."}</span>
      </div>
    );
  }

  // Image preview
  if (attachmentType.startsWith("image/")) {
    return (
      <img 
        src={signedUrl}
        alt={attachmentName || "Imagen"}
        className="max-w-full max-h-64 rounded cursor-pointer hover:opacity-90"
        onClick={() => window.open(signedUrl, "_blank")}
      />
    );
  }

  // Audio player
  if (attachmentType.startsWith("audio/")) {
    return (
      <audio controls className="w-full" src={signedUrl}>
        Tu navegador no soporta audio.
      </audio>
    );
  }

  // Video player
  if (attachmentType.startsWith("video/")) {
    return (
      <video controls className="max-w-full max-h-64 rounded" src={signedUrl}>
        Tu navegador no soporta video.
      </video>
    );
  }

  // Document download
  return (
    <div className="flex items-center gap-2 p-2 bg-background/10 rounded">
      <Paperclip className="h-3 w-3" />
      <span className="text-xs truncate flex-1">{attachmentName}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => window.open(signedUrl, "_blank")}
      >
        <Download className="h-3 w-3" />
      </Button>
    </div>
  );
}
