"use client"

import { useState, useCallback } from "react"
import { useDropzone, FileRejection } from "react-dropzone"
import { X, Upload, Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Compressor from "compressorjs" // Will implement compression next
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface PhotoUploaderProps {
    onUpload: (files: File[]) => void
    maxFiles?: number
    minFiles?: number
}

interface FileWithPreview extends File {
    preview: string
    id: string
    status: "pending" | "validating" | "valid" | "error"
    error?: string
}

// Compression utility
const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        new Compressor(file, {
            quality: 0.8,
            maxWidth: 1200,
            maxHeight: 1200,
            success(result) {
                resolve(result as File)
            },
            error(err) {
                reject(err)
            },
        })
    })
}

export function PhotoUploader({
    onUpload,
    maxFiles = 15,
    minFiles = 10
}: PhotoUploaderProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        // Handle rejections
        fileRejections.forEach((rejection) => {
            toast.error(`${rejection.file.name}: ${rejection.errors[0].message}`)
        })

        // Process new files
        const processedFiles = await Promise.all(acceptedFiles.map(async (file) => {
            try {
                const compressed = await compressImage(file)
                return Object.assign(compressed, {
                    preview: URL.createObjectURL(compressed),
                    id: Math.random().toString(36).substring(7),
                    status: "pending" as const
                }) as FileWithPreview
            } catch (err) {
                toast.error(`Failed to compress ${file.name}`)
                return null
            }
        }))

        const validFiles = processedFiles.filter((f): f is FileWithPreview => f !== null)

        setFiles((prev) => {
            const updated = [...prev, ...validFiles].slice(0, maxFiles)
            // Trigger validation simulation for new files
            validateFiles(updated.filter(f => f.status === "pending"))
            onUpload(updated) // Notify parent
            return updated
        })
    }, [maxFiles, onUpload])

    const validateFiles = async (filesToValidate: FileWithPreview[]) => {
        // Mock validation
        // In real app, this would call API

        // Update status to validating
        setFiles(prev => prev.map(f =>
            filesToValidate.find(fv => fv.id === f.id)
                ? { ...f, status: "validating" }
                : f
        ))

        // Simulate delay and result
        for (const file of filesToValidate) {
            await new Promise(r => setTimeout(r, 800)) // Fake network delay

            setFiles(prev => prev.map(f => {
                if (f.id !== file.id) return f

                // Mock logic: fail if name contains "fail"
                const isValid = !f.name.toLowerCase().includes("fail")
                return {
                    ...f,
                    status: isValid ? "valid" : "error",
                    error: isValid ? undefined : "No face detected"
                }
            }))
        }

        // Notify parent
        // onUpload(currentFiles)
    }

    const removeFile = (id: string) => {
        setFiles(prev => {
            const updated = prev.filter(f => f.id !== id)
            // URL.revokeObjectURL(...) // Cleanup
            return updated
        })
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/webp': []
        },
        maxFiles: maxFiles - files.length,
        disabled: files.length >= maxFiles || isUploading
    })

    return (
        <div className="w-full space-y-4">
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 transition-all text-center cursor-pointer min-h-[200px] flex flex-col items-center justify-center gap-2",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                    files.length >= maxFiles && "opacity-50 cursor-not-allowed"
                )}
            >
                <input {...getInputProps()} />
                <div className="p-4 bg-primary/10 rounded-full mb-2">
                    <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1">
                    <p className="font-semibold text-lg">
                        {isDragActive ? "Drop photos here" : "Upload photos"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Drag & drop or tap to select
                    </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG, WEBP (Max 10MB)
                </p>
            </div>

            {/* File Stats */}
            {files.length > 0 && (
                <div className="flex justify-between items-center text-sm px-1">
                    <span className={cn(
                        "font-medium",
                        files.length < minFiles ? "text-amber-500" : "text-green-600"
                    )}>
                        {files.length} / {minFiles}-{maxFiles} photos
                    </span>
                    {files.length < minFiles && (
                        <span className="text-muted-foreground">Need {minFiles - files.length} more</span>
                    )}
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {files.map((file) => (
                    <div key={file.id} className="relative aspect-square group rounded-lg overflow-hidden border bg-muted">
                        <img
                            src={file.preview}
                            alt="preview"
                            className="w-full h-full object-cover"
                        />

                        {/* Status Indicator */}
                        <div className="absolute top-1 right-1">
                            {file.status === "validating" && (
                                <div className="bg-black/50 p-1 rounded-full backdrop-blur-sm">
                                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                                </div>
                            )}
                            {file.status === "valid" && (
                                <div className="bg-green-500 p-1 rounded-full shadow-sm">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                            {file.status === "error" && (
                                <div className="bg-destructive p-1 rounded-full shadow-sm">
                                    <X className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Error Message Link */}
                        {file.status === "error" && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2">
                                <p className="text-[10px] text-white text-center font-medium leading-tight">
                                    {file.error}
                                </p>
                            </div>
                        )}

                        {/* Remove Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                removeFile(file.id)
                            }}
                            className="absolute top-1 left-1 bg-black/50 hover:bg-destructive text-white p-1 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {/* Add Button in Grid (Mobile friendly) */}
                {files.length < maxFiles && files.length > 0 && (
                    <div
                        onClick={(e) => {
                            // Programmatically open dropzone
                            // Note: dropzone exposes open() but strictly we need to handle it via ref or just rely on main area
                            // For now just show placeholder
                        }}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 cursor-pointer"
                        {...getRootProps()} /* Reuse props to make it clickable */
                    >
                        <input {...getInputProps()} />
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">Add</span>
                    </div>
                )}
            </div>
        </div>
    )
}
