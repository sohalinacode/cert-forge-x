-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);

-- Create storage policies for certificate uploads
CREATE POLICY "Anyone can view certificates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certificates');

CREATE POLICY "Anyone can upload certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Anyone can update certificates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'certificates');

CREATE POLICY "Anyone can delete certificates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'certificates');

-- Create certificates table to track generated certificates
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  certificate_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for certificates table
CREATE POLICY "Anyone can view certificates" 
ON public.certificates 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create certificates" 
ON public.certificates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update certificates" 
ON public.certificates 
FOR UPDATE 
USING (true);