/**
 * src/components/solana/DocumentUploader.tsx
 *
 * Drag-and-drop document hasher + on-chain anchor.
 * The file never leaves the browser — only its SHA-256 hash is stored on Solana.
 */

import { useState, useRef, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { Upload, FileCheck, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";

import { useMercosuria } from "@/hooks/useMercosuria";
import { hashFile, type DocumentType } from "@/lib/program";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: "contract", label: "Contract" },
  { value: "evidence", label: "Evidence" },
  { value: "legalBrief", label: "Legal Brief" },
  { value: "courtOrder", label: "Court Order" },
  { value: "settlement", label: "Settlement" },
  { value: "invoiceReceipt", label: "Invoice / Receipt" },
  { value: "identityDocument", label: "Identity Document" },
  { value: "other", label: "Other" },
];

interface DocumentUploaderProps {
  casePDA: PublicKey;
  onSuccess?: (tx: string, docHash: string) => void;
}

interface PendingDoc {
  file: File;
  hash: string;
  hashing: boolean;
}

export function DocumentUploader({ casePDA, onSuccess }: DocumentUploaderProps) {
  const { attachDocument, connected } = useMercosuria();

  const [pending, setPending] = useState<PendingDoc | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("contract");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setSuccessTx(null);
    setPending({ file, hash: "", hashing: true });
    setDocTitle(file.name);
    try {
      const h = await hashFile(file);
      setPending({ file, hash: h, hashing: false });
    } catch {
      setError("Could not hash file.");
      setPending(null);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending || pending.hashing) return;
    if (!docTitle.trim()) { setError("Please provide a document title."); return; }

    setLoading(true);
    setError(null);
    try {
      const tx = await attachDocument(casePDA, pending.hash, docTitle.trim(), docType);
      setSuccessTx(tx);
      onSuccess?.(tx, pending.hash);
      setPending(null);
      setDocTitle("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message ?? "Failed to anchor document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCheck className="h-5 w-5 text-emerald-600" />
          Attach Document On-Chain
        </CardTitle>
        <CardDescription>
          The file stays private. Only its SHA-256 hash is written to Solana, creating a tamper-proof audit trail.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragging ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" className="hidden" onChange={onFileChange} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop a file, or <span className="text-emerald-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG, PNG, etc.</p>
          </div>

          {/* File preview */}
          {pending && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{pending.file.name}</p>
                {pending.hashing ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Computing hash…
                  </p>
                ) : (
                  <p className="text-xs font-mono text-muted-foreground truncate">{pending.hash}</p>
                )}
              </div>
              <button type="button" onClick={() => { setPending(null); setDocTitle(""); }}>
                <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
              </button>
            </div>
          )}

          {pending && !pending.hashing && (
            <>
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="docTitle">Document Title</Label>
                <Input
                  id="docTitle"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  maxLength={128}
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label>Document Type</Label>
                <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successTx && (
            <Alert className="border-emerald-600 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Hash anchored!{" "}
                <a
                  href={`https://explorer.solana.com/tx/${successTx}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Explorer
                </a>
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!pending || pending.hashing || loading || !connected}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Anchoring…</>
            ) : (
              "Anchor Document Hash On-Chain"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
