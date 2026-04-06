"use client";

import CardToolbar from "./card-toolbar";
import { Wrench } from "lucide-react";

interface CardComingSoonProps {
    title?: string;
}

const CardComingSoon = ({ title }: CardComingSoonProps) => {
    return (
        <CardToolbar title={title ?? "Sắp ra mắt"}>
            <div className="flex w-full h-[calc(100%-16px)] items-center justify-center flex-col text-muted-foreground p-4 text-center bg-card rounded-md border-dashed border-2 m-2">
                <Wrench className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm font-medium text-foreground">Tính năng đang được phát triển</span>
                <span className="text-xs mt-1">Vui lòng chờ các bản cập nhật tiếp theo.</span>
            </div>
        </CardToolbar>
    );
};

export default CardComingSoon;
