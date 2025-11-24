import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Paperclip } from "lucide-react";

interface AlarmAttachmentProps {
  attachmentPath: string;
  attachmentName: string;
  attachmentType: string | null;
}

export default function AlarmAttachment({ 
  attachmentPath, 
  attachmentName, 
  attachmentType 
}: AlarmAttachmentProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadSignedUrl();
  }, [attachmentPath]);

  const loadSignedUrl = async () => {
    const { data } = await supabase.storage
      .from("alarm-attachments")
      .createSignedUrl(attachmentPath, 3600);
    if (data?.signedUrl) {
      setSignedUrl(data.signedUrl);
    }
  };

  if (!signedUrl) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <Paperclip className="h-4 w-4" />
        <span className="text-sm truncate">{attachmentName || "Cargando..."}</span>
      </div>
    );
  }

  // Image preview
  if (attachmentType?.startsWith("image/")) {
    return (
      <div className="space-y-2">
        <img 
          src={signedUrl}
          alt={attachmentName}
          className="max-w-full max-h-96 rounded cursor-pointer hover:opacity-90 border"
          onClick={() => window.open(signedUrl, "_blank")}
        />
        <p className="text-xs text-muted-foreground">{attachmentName}</p>
      </div>
    );
  }

  // Audio player
  if (attachmentType?.startsWith("audio/")) {
    return (
      <div className="space-y-2">
        <audio controls className="w-full" src={signedUrl}>
          Tu navegador no soporta audio.
        </audio>
        <p className="text-xs text-muted-foreground">{attachmentName}</p>
      </div>
    );
  }

  // Video player
  if (attachmentType?.startsWith("video/")) {
    return (
      <div className="space-y-2">
        <video controls className="max-w-full max-h-96 rounded" src={signedUrl}>
          Tu navegador no soporta video.
        </video>
        <p className="text-xs text-muted-foreground">{attachmentName}</p>
      </div>
    );
  }

  // PDF embed
  if (attachmentType?.includes("pdf")) {
    return (
      <div className="space-y-2">
        <iframe 
          src={signedUrl} 
          className="w-full h-96 border rounded"
          title={attachmentName}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{attachmentName}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(signedUrl, "_blank")}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
      </div>
    );
  }

  // Document download
  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        <div>
          <p className="text-sm font-medium">{attachmentName}</p>
          <p className="text-xs text-muted-foreground">{attachmentType || "Documento"}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(signedUrl, "_blank")}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
