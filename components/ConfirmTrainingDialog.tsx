"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, Clock, Sparkles } from "lucide-react"

interface ConfirmTrainingDialogProps {
    open: boolean
    onConfirm: () => void
    onCancel: () => void
    photoCount: number
}

export function ConfirmTrainingDialog({ open, onConfirm, onCancel, photoCount }: ConfirmTrainingDialogProps) {
    const [understood, setUnderstood] = useState(false)

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Ready to Train Your AI Model?
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Confirm training details and expectations
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* What to Expect */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-3">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                                <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Training Time: 10-20 minutes</p>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    We're training a custom AI model on your {photoCount} photos. This takes time but ensures the best results.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg space-y-3">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                                <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">Important:</p>
                                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                                    <li>Don't close this tab or refresh the page</li>
                                    <li>You'll receive an email when it's ready</li>
                                    <li>Results work best with high-quality, well-lit photos</li>
                                    <li>This process can only be run once per session</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={understood}
                            onChange={(e) => setUnderstood(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-muted-foreground">
                            I understand this will take 10-20 minutes and I should not refresh the page
                        </span>
                    </label>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={!understood}>
                        Start Training
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
