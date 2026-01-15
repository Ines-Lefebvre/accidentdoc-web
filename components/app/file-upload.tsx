"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
  success?: boolean;
  maxSize?: number; // en bytes
  acceptedTypes?: string[];
}

const DEFAULT_MAX_SIZE = 40 * 1024 * 1024; // 40 Mo
const DEFAULT_ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/webp",
];

export function FileUpload({
  onFileSelect,
  onUpload,
  isUploading = false,
  uploadProgress = 0,
  error,
  success = false,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: acceptedTypes.reduce((acc, type) => {
        acc[type] = [];
        return acc;
      }, {} as Record<string, string[]>),
      maxSize,
      multiple: false,
      disabled: isUploading,
    });

  const handleUpload = async () => {
    if (selectedFile) {
      await onUpload(selectedFile);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " octets";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
  };

  const rejectionError = fileRejections[0]?.errors[0];

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive && "border-primary bg-primary/5 dropzone-active",
          !isDragActive && "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-50",
          error && "border-destructive",
          success && "border-green-500 bg-green-50"
        )}
      >
        <input {...getInputProps()} />

        {success ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-green-700 font-medium">
              Document uploadé avec succès !
            </p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="h-12 w-12 text-primary" />
            <div>
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Changer de fichier
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload
              className={cn(
                "h-12 w-12",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <div>
              <p className="font-medium text-foreground">
                {isDragActive
                  ? "Déposez votre fichier ici"
                  : "Glissez votre fichier ici"}
              </p>
              <p className="text-sm text-muted-foreground">
                ou cliquez pour sélectionner
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG, HEIC • Max {formatFileSize(maxSize)}
            </p>
          </div>
        )}
      </div>

      {/* Barre de progression */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            Analyse en cours... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Erreurs */}
      {(error || rejectionError) && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>
            {error ||
              (rejectionError?.code === "file-too-large"
                ? `Le fichier est trop volumineux (max ${formatFileSize(maxSize)})`
                : rejectionError?.code === "file-invalid-type"
                ? "Type de fichier non accepté"
                : rejectionError?.message)}
          </span>
        </div>
      )}

      {/* Bouton d'upload */}
      {selectedFile && !isUploading && !success && (
        <Button onClick={handleUpload} className="w-full" size="lg">
          <Upload className="h-4 w-4 mr-2" />
          Analyser le document
        </Button>
      )}

      {/* Astuce */}
      {!selectedFile && !isUploading && (
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Astuce :</strong> Photographiez directement le CERFA avec
            votre téléphone si vous n'avez pas le fichier numérique. Assurez-vous
            que le document est bien lisible.
          </p>
        </div>
      )}
    </div>
  );
}
