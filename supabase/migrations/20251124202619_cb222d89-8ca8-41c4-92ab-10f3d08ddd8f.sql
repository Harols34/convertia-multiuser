-- Crear bucket para adjuntos del chat si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para chat-attachments
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND auth.role() = 'authenticated'
);

-- Agregar columnas para archivos adjuntos en chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_name text,
ADD COLUMN IF NOT EXISTS attachment_type text;