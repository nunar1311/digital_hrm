"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History } from "lucide-react";

import { ContractListTab } from "@/components/contracts/contract-list-tab";
import { ContractAppendicesTab } from "@/components/contracts/contract-appendices-tab";

export function ContractsClient() {
    const [activeTab, setActiveTab] = useState("list");

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hợp đồng lao động</h1>
                    <p className="text-muted-foreground">Quản lý vòng đời hợp đồng và lịch sử phụ lục.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-background border h-11 no-scrollbar w-full justify-start overflow-x-auto">
                    <TabsTrigger value="list" className="gap-2 px-4">
                        <FileText className="h-4 w-4" />
                        Danh sách Hợp đồng
                    </TabsTrigger>
                    <TabsTrigger value="appendices" className="gap-2 px-4">
                        <History className="h-4 w-4" />
                        Phụ lục Hợp đồng
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="m-0">
                    <ContractListTab />
                </TabsContent>

                <TabsContent value="appendices" className="m-0">
                    <ContractAppendicesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
