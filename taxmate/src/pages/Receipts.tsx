import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetReceipts, useUploadReceipt } from "@/lib/api-client";
import { toBase64, formatNaira } from "@/lib/utils";
import { Camera, FileText, Loader2, UploadCloud, CheckCircle2, ScanLine, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Receipts() {
  const { data: receipts, isLoading: isReceiptsLoading } = useGetReceipts();
  const uploadMutation = useUploadReceipt();
  const normalizedReceipts = Array.isArray(receipts) ? receipts : [];
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setScannedData(null);

    try {
      const base64 = await toBase64(file);
      // Simulate scanning delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";
      const result = await uploadMutation.mutateAsync({
        data: {
          imageData: base64,
          mimeType: mimeType || "image/jpeg"
        }
      });
      
      setScannedData(result);
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setPreview(null);
    setScannedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AppLayout title="Scan Receipt">
      <div className="px-6 pb-6">
        
        {/* Main Scanner Area */}
        <div className="mb-10  pt-12">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileSelect}
          />

          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-primary/5 border-2 border-primary/20 border-dashed rounded-[2rem] p-8 text-center cursor-pointer hover:bg-primary/10 transition-colors group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-display font-bold text-primary mb-2">Snap a Receipt</h3>
                <p className="text-muted-foreground text-sm px-4">
                  Take a picture of an invoice or receipt. We'll extract the details automatically.
                </p>
                <Button className="mt-6 rounded-full w-full max-w-[200px]" variant="default">
                  Open Camera
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-black rounded-[2rem] overflow-hidden shadow-2xl"
              >
                <img src={preview} alt="Receipt preview" className="w-full h-64 object-cover opacity-60" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white bg-gradient-to-t from-black/80 to-black/20">
                  {uploadMutation.isPending ? (
                    <>
                      <div className="w-16 h-16 relative mb-4">
                        <div className="absolute inset-0 border-4 border-white/20 border-t-primary rounded-full animate-spin"></div>
                        <ScanLine className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <h3 className="text-xl font-bold font-display">Scanning details...</h3>
                      <p className="text-white/70 text-sm mt-1">Extracting amount and date</p>
                    </>
                  ) : scannedData ? (
                    <>
                      <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
                      <h3 className="text-2xl font-bold font-display mb-1 text-center">Receipt Processed</h3>
                      
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 w-full mt-4 border border-white/20">
                        <div className="flex justify-between mb-2">
                          <span className="text-white/70 text-sm">Vendor</span>
                          <span className="font-medium">{scannedData.extractedVendor || "Unknown"}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-white/70 text-sm">Amount</span>
                          <span className="font-bold text-lg text-primary">{formatNaira(scannedData.extractedAmount)}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 w-full mt-6">
                        <Button variant="outline" className="flex-1 bg-transparent text-white border-white/30 hover:bg-white/10" onClick={resetScanner}>
                          Retake
                        </Button>
                        <TransactionForm 
                          initialData={{
                            type: 'expense',
                            amount: scannedData.extractedAmount || 0,
                            description: scannedData.extractedVendor || 'Receipt expense',
                            receiptId: scannedData.id,
                            date: scannedData.extractedDate || format(new Date(), 'yyyy-MM-dd')
                          }}
                          onSuccess={resetScanner}
                          trigger={
                            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30">
                              Save Expense
                            </Button>
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                      <h3 className="text-xl font-bold">Upload Failed</h3>
                      <Button variant="secondary" className="mt-4" onClick={resetScanner}>Try Again</Button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Past Receipts List */}
        <div>
          <h3 className="text-lg font-bold font-display mb-4">Past Scans</h3>
          
          {isReceiptsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
            </div>
          ) : normalizedReceipts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {normalizedReceipts.map(r => (
                <div key={r.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 relative group">
                  <div className="h-24 bg-muted relative">
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt="Receipt" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                      {format(parseISO(r.createdAt), 'MMM d')}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-foreground text-sm truncate">{formatNaira(r.extractedAmount)}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.extractedVendor || 'Unknown Vendor'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-secondary/50 rounded-3xl">
              <img 
                src={`${import.meta.env.VITE_API_URL}images/empty-receipts.png`} 
                alt="No receipts" 
                className="w-40 h-40 mx-auto opacity-80 mix-blend-multiply"
              />
              <p className="text-muted-foreground mt-4 font-medium">Your scanned receipts will live here.</p>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
