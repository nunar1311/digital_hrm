"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Webcam from "react-webcam";
import Image from "next/image";

interface CameraConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: (photoBase64: string) => void;
    isPending?: boolean;
}

export function CameraConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    isPending,
}: CameraConfirmDialogProps) {
    const webcamRef = useRef<Webcam>(null);
    const [captured, setCaptured] = useState<string | null>(null);

    const handleCapture = useCallback(() => {
        const screenshot = webcamRef.current?.getScreenshot();
        if (screenshot) {
            setCaptured(screenshot);
        }
    }, []);

    const handleRetake = useCallback(() => {
        setCaptured(null);
    }, []);

    const handleConfirm = useCallback(() => {
        if (captured) {
            onConfirm(captured);
        }
    }, [captured, onConfirm]);

    const handleOpenChange = useCallback(
        (value: boolean) => {
            if (!value) {
                setCaptured(null);
            }
            onOpenChange(value);
        },
        [onOpenChange],
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                    {captured ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <Image
                            src={captured}
                            alt="Ảnh chụp"
                            className="h-full w-full object-cover"
                            fill
                        />
                    ) : (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="h-full w-full object-cover"
                            videoConstraints={{ facingMode: "user" }}
                        />
                    )}
                </div>

                <DialogFooter>
                    {captured ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleRetake}
                                disabled={isPending}
                            >
                                <RotateCcw className="mr-1.5 h-4 w-4" />
                                Chụp lại
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={isPending}
                            >
                                <Check className="mr-1.5 h-4 w-4" />
                                Xác nhận
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    handleOpenChange(false)
                                }
                            >
                                Hủy
                            </Button>
                            <Button onClick={handleCapture}>
                                Chụp ảnh
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
