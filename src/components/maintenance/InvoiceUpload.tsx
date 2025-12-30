
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface InvoiceUploadProps {
  onFileChange: (file: File | null) => void;
  currentFile: File | null;
}

const InvoiceUpload = ({ onFileChange, currentFile }: InvoiceUploadProps) => {
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);
  const { toast } = useToast();

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onFileChange(file);
    
    // Here you would integrate with an AI service to extract information from the invoice
    // For now, we'll just show a loading state
    setIsProcessingInvoice(true);
    
    // Simulate AI processing
    setTimeout(() => {
      toast({
        title: "Invoice processed",
        description: "Please review and adjust the auto-filled information."
      });
      setIsProcessingInvoice(false);
    }, 2000);
  };

  return (
    <div>
      <Label htmlFor="invoice">Upload Invoice (Optional)</Label>
      <div className="mt-1">
        <Input
          id="invoice"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleInvoiceUpload}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {isProcessingInvoice && (
          <p className="text-sm text-blue-600 mt-1">
            Processing invoice with AI...
          </p>
        )}
        {currentFile && (
          <p className="text-sm text-green-600 mt-1">
            ✓ {currentFile.name}
          </p>
        )}
      </div>
    </div>
  );
};

export default InvoiceUpload;
