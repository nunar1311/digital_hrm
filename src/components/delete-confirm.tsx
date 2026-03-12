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
    title: string;
    description: string;
    onConfirm: () => void;
}

const DeleteConfirm = ({
    title,
    description,
    onConfirm,
}: DeleteConfirmProps) => {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                >
                    <Trash2Icon className="text-destructive mr-2 h-4 w-4" />
                    <span>Xóa</span>
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        Xác nhận
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteConfirm;
