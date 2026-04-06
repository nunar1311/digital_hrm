import React, { useEffect, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Trash2Icon } from "lucide-react";
import { DropdownMenuItem } from "./ui/dropdown-menu";

interface DeleteConfirmProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title?: string;
    description?: string;
    confirmText?: string;
    onConfirm: () => void;
    isDeleting?: boolean;
}

const DeleteConfirm = ({
    open,
    onOpenChange,
    title = "Xóa",
    description = "Bạn có chắc chắn muốn xóa?",
    confirmText = "Xác nhận",
    onConfirm,
    isDeleting = false,
}: DeleteConfirmProps) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const currentOpen = isControlled ? open : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(newOpen);
        }
        onOpenChange?.(newOpen);
    };

    return (
        <AlertDialog open={currentOpen} onOpenChange={handleOpenChange}>
            {!isControlled && (
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                    >
                        <Trash2Icon className="text-destructive mr-2 h-4 w-4" />
                        <span>Xóa</span>
                    </DropdownMenuItem>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Đang xóa..." : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteConfirm;
