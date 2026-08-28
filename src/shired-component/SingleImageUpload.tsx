/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { uploadImageToR2 } from "@/lib/uploadImage";

export default function SingleImageUpload({ onUpload }: any) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"success" | "error" | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const handleImageUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    setErrorMessage("");

    try {
      const { publicUrl } = await uploadImageToR2(file);
      onUpload(publicUrl);
      setUploadStatus("success");
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload image",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2 ">
      <div className="relative group">
        <label
          htmlFor="file-upload"
          className={`
            flex flex-col  items-center justify-center w-full p-3 border-2 h-[100px] border-dashed rounded-lg cursor-pointer
            ${isUploading
              ? "border-gray-300 bg-gray-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }
            transition-colors duration-200
          `}
        >
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6 text-gray-500" />
            )}
            <div className="text-sm text-gray-600">
              {isUploading ? (
                <p>Compressing & uploading to R2…</p>
              ) : (
                <>
                  <p className="font-medium text-gray-900">upload or drag</p>
                  <p>Auto-converted to WebP (max 1000×1000)</p>
                </>
              )}
            </div>
          </div>
          <input
            id="file-upload"
            type="file"
            accept=".jpg, .jpeg, .png, .webp, .heic, .heif, .avif, .svg"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
      </div>

      {uploadStatus === "success" && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>Image uploaded to R2 successfully!</span>
        </div>
      )}

      {uploadStatus === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <XCircle className="w-4 h-4" />
          <span>{errorMessage || "Error uploading image"}</span>
        </div>
      )}
    </div>
  );
}
