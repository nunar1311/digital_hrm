"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

const AddCardDialog = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="xs">
                    <Plus />
                    thẻ
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl sm:h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Coming soon</DialogTitle>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};

export default AddCardDialog;
