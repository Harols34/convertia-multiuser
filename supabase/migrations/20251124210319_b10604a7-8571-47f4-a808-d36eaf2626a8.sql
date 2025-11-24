-- Allow authenticated users to download alarm attachments
CREATE POLICY "Authenticated users can download alarm attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'alarm-attachments');

-- Allow anonymous users to download alarm attachments (for end users)
CREATE POLICY "Anonymous users can download alarm attachments"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'alarm-attachments');

-- Allow authenticated users to download chat attachments
CREATE POLICY "Authenticated users can download chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- Allow anonymous users to download chat attachments (for end users)
CREATE POLICY "Anonymous users can download chat attachments"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'chat-attachments');

-- Allow anonymous users to upload chat attachments
CREATE POLICY "Anonymous users can upload chat attachments"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow anonymous users to upload alarm attachments
CREATE POLICY "Anonymous users can upload alarm attachments"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'alarm-attachments');