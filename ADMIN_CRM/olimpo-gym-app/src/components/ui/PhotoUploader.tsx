"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, User } from "lucide-react";

interface PhotoUploaderProps {
  currentPhotoUrl?: string | null;
  onPhotoUploaded: (url: string) => void;
  isUploadingState?: (uploading: boolean) => void;
}

export function PhotoUploader({ currentPhotoUrl, onPhotoUploaded, isUploadingState }: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "olimpo_members";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setIsUploading(true);
    if (isUploadingState) isUploadingState(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setPreviewUrl(data.secure_url);
        onPhotoUploaded(data.secure_url);
      } else {
        throw new Error(data.error?.message || "Error al subir la imagen");
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("No se pudo subir la foto. Asegúrate de configurar Cloudinary correctamente.");
      setPreviewUrl(currentPhotoUrl || null); // Revert
    } finally {
      setIsUploading(false);
      if (isUploadingState) isUploadingState(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center group relative cursor-pointer" onClick={() => !isUploading && fileInputRef.current?.click()}>
      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-olimpo-surface-light border-2 border-dashed border-olimpo-gold/50 flex items-center justify-center mb-2 overflow-hidden shadow-[0_0_20px_rgba(197,165,90,0.3)] transition-all group-hover:border-solid group-hover:border-olimpo-gold relative">
        {previewUrl ? (
          <img src={previewUrl} alt="Foto" className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : 'opacity-100'}`} />
        ) : (
          <User className="w-10 h-10 sm:w-12 sm:h-12 text-olimpo-gold/50 group-hover:text-olimpo-gold transition-colors" />
        )}

        {/* Overlay Hover */}
        <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 ${!isUploading && 'group-hover:opacity-100'} transition-opacity`}>
          <Camera className="w-6 h-6 mb-1" />
          <span className="text-[10px] sm:text-xs font-bold text-center px-1">Cambiar Foto</span>
        </div>

        {/* Uploading Spinner */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-8 h-8 text-olimpo-gold animate-spin" />
          </div>
        )}
      </div>

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      
      {!previewUrl && (
        <span className="text-sm font-medium text-olimpo-gold mt-1 group-hover:underline">Subir Fotografía</span>
      )}
    </div>
  );
}
