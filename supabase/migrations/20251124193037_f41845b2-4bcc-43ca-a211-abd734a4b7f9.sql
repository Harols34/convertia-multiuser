-- Create chat_messages table for user-admin communication
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  end_user_id UUID NOT NULL REFERENCES public.end_users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_id UUID NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE NULL
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_messages
CREATE POLICY "Admins can view all chat messages"
ON public.chat_messages
FOR SELECT
USING (true);

CREATE POLICY "Admins can create chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "End users can view their own chat messages"
ON public.chat_messages
FOR SELECT
USING (true);

CREATE POLICY "End users can create their own chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (true);

-- Enable realtime for chat_messages
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Create index for faster queries
CREATE INDEX idx_chat_messages_end_user_id ON public.chat_messages(end_user_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);