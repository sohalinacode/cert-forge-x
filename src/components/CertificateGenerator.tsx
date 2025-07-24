import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Send } from "lucide-react";

const CertificateGenerator = () => {
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setCertificateFile(file);
    }
  };

  const uploadCertificate = async (file: File): Promise<string | null> => {
    try {
      const fileName = `certificate_${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('certificates')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload certificate",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleGenerateAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientName.trim() || !recipientEmail.trim() || !certificateFile) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields and upload a certificate image",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setIsSending(true);

    try {
      // Upload certificate to storage
      const certificateUrl = await uploadCertificate(certificateFile);
      
      if (!certificateUrl) {
        setIsUploading(false);
        setIsSending(false);
        return;
      }

      setIsUploading(false);

      // Save certificate record to database
      const { data: certificateData, error: dbError } = await supabase
        .from('certificates')
        .insert({
          recipient_name: recipientName.trim(),
          recipient_email: recipientEmail.trim(),
          certificate_url: certificateUrl,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        toast({
          title: "Database Error",
          description: "Failed to save certificate record",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }

      // Send email with certificate (placeholder for now)
      toast({
        title: "Certificate Generated!",
        description: `Certificate uploaded and record saved for ${recipientName}. Email functionality will be added when Resend API key is configured.`,
      });

      // Reset form
      setRecipientName("");
      setRecipientEmail("");
      setCertificateFile(null);
      const fileInput = document.getElementById('certificate-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Generate & Send Certificate
        </CardTitle>
        <CardDescription>
          Fill in the recipient details and upload the certificate image to generate and send the e-certificate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerateAndSend} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipient-name">Recipient Name</Label>
            <Input
              id="recipient-name"
              type="text"
              placeholder="Enter recipient's full name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="Enter recipient's email address"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate-upload">Certificate Image</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="certificate-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="cursor-pointer"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {certificateFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {certificateFile.name} ({(certificateFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isUploading || isSending}
          >
            {isUploading ? (
              "Uploading Certificate..."
            ) : isSending ? (
              "Sending Email..."
            ) : (
              "Generate & Send Certificate"
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Instructions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Enter the recipient's full name as it should appear on the certificate</li>
            <li>• Provide a valid email address where the certificate will be sent</li>
            <li>• Upload an image file (JPG, PNG, etc.) of the certificate template</li>
            <li>• Maximum file size: 5MB</li>
            <li>• The certificate will be stored and an email will be sent automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateGenerator;