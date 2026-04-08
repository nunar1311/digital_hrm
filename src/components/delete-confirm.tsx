import React, { useState } from "react";
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
import { useTranslations } from "next-intl";

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
    title,
    description,
    confirmText,
    onConfirm,
    isDeleting = false,
}: DeleteConfirmProps) => {
    const t = useTranslations("Common");
    const [internalOpen, setInternalOpen] = useState(false);

    const resolvedTitle = title ?? t("delete");
    const resolvedDescription =
        description ?? t("confirmDeleteDescription");
    const resolvedConfirmText = confirmText ?? t("confirm");
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
                        <span>{t("delete")}</span>
                    </DropdownMenuItem>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolvedDescription}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? t("deleting") : resolvedConfirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteConfirm;
