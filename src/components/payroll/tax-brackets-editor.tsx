"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    Receipt,
    Plus,
    Pencil,
    Trash2,
    Calculator,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Save,
} from "lucide-react";
import type { TaxBracket } from "@/app/[locale]/(protected)/payroll/types";
import { TAX_BRACKETS_2024 } from "@/app/[locale]/(protected)/payroll/types";

interface TaxBracketItem extends Omit<TaxBracket, "max"> {
    id: string;
    min: number;
    max: number | string;
}

interface TaxBracketsEditorProps {
    initialBrackets?: TaxBracket[];
    onSave: (brackets: TaxBracket[]) => Promise<void>;
}

const PRESETS = [
    {
        year: 2024,
        brackets: TAX_BRACKETS_2024,
    },
];

export function TaxBracketsEditor({
    initialBrackets,
    onSave,
}: TaxBracketsEditorProps) {
    const t = useTranslations("ProtectedPages");
    const locale = useLocale();

    const [brackets, setBrackets] = useState<TaxBracketItem[]>(() => {
        if (initialBrackets && initialBrackets.length > 0) {
            return initialBrackets.map((b, i) => ({
                ...b,
                id: String(i),
                min: i === 0 ? 0 : initialBrackets[i - 1].max as number,
            }));
        }
        return [
            { id: "1", min: 0, max: 5000000, rate: 0.05, deduction: 0 },
            { id: "2", min: 5000000, max: 10000000, rate: 0.1, deduction: 250000 },
            { id: "3", min: 10000000, max: 18000000, rate: 0.15, deduction: 750000 },
            { id: "4", min: 18000000, max: 32000000, rate: 0.2, deduction: 1650000 },
            { id: "5", min: 32000000, max: 52000000, rate: 0.25, deduction: 3250000 },
            { id: "6", min: 52000000, max: 78000000, rate: 0.3, deduction: 5850000 },
            { id: "7", min: 78000000, max: 100000000, rate: 0.35, deduction: 9850000 },
            { id: "8", min: 100000000, max: "∞", rate: 0.4, deduction: 18150000 },
        ];
    });

    const [editingBracket, setEditingBracket] = useState<TaxBracketItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewIncome, setPreviewIncome] = useState(15000000);

    const handleAddBracket = () => {
        const lastBracket = brackets[brackets.length - 1];
        const newMax = typeof lastBracket.max === "number" ? lastBracket.max * 2 : 100000000;
        const newMin = typeof lastBracket.max === "number" ? lastBracket.max : 0;

        setEditingBracket({
            id: String(Date.now()),
            min: newMin,
            max: newMax,
            rate: 0.4,
            deduction: 0,
        });
    };

    const handleEditBracket = (bracket: TaxBracketItem) => {
        setEditingBracket({ ...bracket });
    };

    const handleDeleteBracket = (id: string) => {
        if (brackets.length <= 1) {
            toast.error(t("payrollTaxBracketsMinOne"));
            return;
        }
        setBrackets(brackets.filter((b) => b.id !== id));
        toast.success(t("payrollTaxBracketsDeleted"));
    };

    const handleSaveBracket = (bracket: TaxBracketItem) => {
        const existingIndex = brackets.findIndex((b) => b.id === bracket.id);

        if (existingIndex >= 0) {
            const updated = [...brackets];
            updated[existingIndex] = bracket;
            setBrackets(updated);
        } else {
            setBrackets([...brackets, bracket].sort((a, b) => {
                const aMax = typeof a.max === "number" ? a.max : Infinity;
                const bMax = typeof b.max === "number" ? b.max : Infinity;
                return aMax - bMax;
            }));
        }

        setEditingBracket(null);
        toast.success(t("payrollTaxBracketsSavedSingle"));
    };

    const handleSaveAll = async () => {
        setIsSubmitting(true);
        try {
            const taxBrackets: TaxBracket[] = brackets.map((b) => ({
                max: typeof b.max === "string" ? Infinity : b.max,
                rate: b.rate,
                deduction: b.deduction,
            }));
            await onSave(taxBrackets);
            toast.success(t("payrollTaxBracketsSavedAll"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("payrollTaxBracketsSaveError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setBrackets([
            { id: "1", min: 0, max: 5000000, rate: 0.05, deduction: 0 },
            { id: "2", min: 5000000, max: 10000000, rate: 0.1, deduction: 250000 },
            { id: "3", min: 10000000, max: 18000000, rate: 0.15, deduction: 750000 },
            { id: "4", min: 18000000, max: 32000000, rate: 0.2, deduction: 1650000 },
            { id: "5", min: 32000000, max: 52000000, rate: 0.25, deduction: 3250000 },
            { id: "6", min: 52000000, max: 78000000, rate: 0.3, deduction: 5850000 },
            { id: "7", min: 78000000, max: 100000000, rate: 0.35, deduction: 9850000 },
            { id: "8", min: 100000000, max: "∞", rate: 0.4, deduction: 18150000 },
        ]);
        toast.success(t("payrollTaxBracketsResetSuccess"));
    };

    const calculateTax = (income: number): number => {
        for (const bracket of brackets) {
            const maxValue = typeof bracket.max === "number" ? bracket.max : Infinity;
            if (income <= maxValue) {
                return Math.round(income * bracket.rate - bracket.deduction);
            }
        }
        return 0;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatRate = (rate: number) => {
        return `${(rate * 100).toFixed(1)}%`;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        <CardTitle>{t("payrollTaxBracketsTitle")}</CardTitle>
                    </div>
                    <Badge variant="outline" className="font-normal">
                        {t("payrollTaxBracketsBadge")}
                    </Badge>
                </div>
                <CardDescription>
                    {t("payrollTaxBracketsDescription")}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Tabs defaultValue="brackets">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="brackets">
                            <Receipt className="h-4 w-4 mr-2" />
                            {t("payrollTaxBracketsTabBrackets")}
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                            <Calculator className="h-4 w-4 mr-2" />
                            {t("payrollTaxBracketsTabPreview")}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="brackets" className="mt-4 space-y-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">{t("payrollTaxBracketsHeadLevel")}</TableHead>
                                        <TableHead className="text-right">{t("payrollTaxBracketsHeadFrom")}</TableHead>
                                        <TableHead className="text-right">{t("payrollTaxBracketsHeadTo")}</TableHead>
                                        <TableHead className="text-right">{t("payrollTaxBracketsHeadRate")}</TableHead>
                                        <TableHead className="text-right">{t("payrollTaxBracketsHeadDeduction")}</TableHead>
                                        <TableHead className="w-24 text-right">{t("payrollTaxBracketsHeadActions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {brackets.map((bracket, index) => (
                                        <TableRow key={bracket.id}>
                                            <TableCell className="font-medium">
                                                <Badge variant="outline">{index + 1}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(bracket.min)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {typeof bracket.max === "string"
                                                    ? bracket.max
                                                    : formatCurrency(bracket.max)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="secondary">
                                                    {formatRate(bracket.rate)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {bracket.deduction > 0
                                                    ? formatCurrency(bracket.deduction)
                                                    : t("payrollNotAvailable")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleEditBracket(bracket)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleDeleteBracket(bracket.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between">
                            <Button variant="outline" onClick={handleReset}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                {t("payrollTaxBracketsReset2024")}
                            </Button>
                            <Button onClick={handleAddBracket}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t("payrollTaxBracketsAdd")}
                            </Button>
                        </div>

                        <Separator />

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={handleReset}
                            >
                                {t("payrollCancel")}
                            </Button>
                            <Button onClick={handleSaveAll} disabled={isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {isSubmitting ? t("payrollSaving") : t("payrollTaxBracketsSave")}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="preview" className="mt-4 space-y-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Label htmlFor="previewIncome" className="whitespace-nowrap">
                                    {t("payrollTaxBracketsSampleTaxableIncome")}
                                </Label>
                                <Input
                                    id="previewIncome"
                                    type="number"
                                    className="max-w-xs"
                                    value={previewIncome}
                                    onChange={(e) => setPreviewIncome(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <Card className="bg-muted/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                        {t("payrollTaxBracketsPreviewResultFor", { income: formatCurrency(previewIncome) })}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            {brackets.map((bracket, index) => {
                                                const maxValue = typeof bracket.max === "number" ? bracket.max : Infinity;
                                                const minValue = bracket.min;
                                                const isInBracket = previewIncome > minValue && previewIncome <= maxValue;

                                                return (
                                                    <div
                                                        key={bracket.id}
                                                        className={`flex items-center justify-between p-2 rounded ${
                                                            isInBracket ? "bg-primary/10 font-medium" : ""
                                                        }`}
                                                    >
                                                        <span>
                                                            {t("payrollTaxBracketsLevelRange", {
                                                                level: index + 1,
                                                                min: formatCurrency(minValue),
                                                            })} -{" "}
                                                            {typeof bracket.max === "string"
                                                                ? bracket.max
                                                                : formatCurrency(bracket.max)}
                                                        </span>
                                                        <Badge variant={isInBracket ? "default" : "outline"}>
                                                            {formatRate(bracket.rate)}
                                                        </Badge>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex flex-col justify-center space-y-4">
                                            <div className="p-4 rounded-lg bg-background border">
                                                <p className="text-sm text-muted-foreground">{t("payrollTaxBracketsTaxableIncome")}</p>
                                                <p className="text-2xl font-bold">
                                                    {formatCurrency(previewIncome)}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                                                <p className="text-sm text-muted-foreground">{t("payrollTaxBracketsPitPayable")}</p>
                                                <p className="text-2xl font-bold text-red-600">
                                                    {formatCurrency(calculateTax(previewIncome))}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                                                <p className="text-sm text-muted-foreground">{t("payrollTaxBracketsIncomeAfterTax")}</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {formatCurrency(previewIncome - calculateTax(previewIncome))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div className="space-y-1 text-sm">
                                        <p className="font-medium text-amber-800 dark:text-amber-200">
                                            {t("payrollTaxBracketsNoticeTitle")}
                                        </p>
                                        <ul className="list-disc list-inside text-amber-700 dark:text-amber-300 space-y-1">
                                            <li>{t("payrollTaxBracketsNotice1")}</li>
                                            <li>{t("payrollTaxBracketsNotice2")}</li>
                                            <li>{t("payrollTaxBracketsNotice3")}</li>
                                            <li>{t("payrollTaxBracketsNotice4")}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <Dialog open={!!editingBracket} onOpenChange={() => setEditingBracket(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {brackets.find((b) => b.id === editingBracket?.id)
                                ? t("payrollTaxBracketsEdit")
                                : t("payrollTaxBracketsAddNew")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("payrollTaxBracketsDialogDescription")}
                        </DialogDescription>
                    </DialogHeader>

                    {editingBracket && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min">{t("payrollTaxBracketsHeadFrom")}</Label>
                                    <Input
                                        id="min"
                                        type="number"
                                        value={editingBracket.min}
                                        onChange={(e) =>
                                            setEditingBracket({
                                                ...editingBracket,
                                                min: parseInt(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max">{t("payrollTaxBracketsHeadTo")}</Label>
                                    <Input
                                        id="max"
                                        type="text"
                                        placeholder={t("payrollTaxBracketsInfinityPlaceholder")}
                                        value={editingBracket.max}
                                        onChange={(e) =>
                                            setEditingBracket({
                                                ...editingBracket,
                                                max: e.target.value === "" ? "∞" : parseInt(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rate">{t("payrollTaxBracketsHeadRate")}</Label>
                                    <Input
                                        id="rate"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={editingBracket.rate * 100}
                                        onChange={(e) =>
                                            setEditingBracket({
                                                ...editingBracket,
                                                rate: (parseFloat(e.target.value) || 0) / 100,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deduction">{t("payrollTaxBracketsHeadDeduction")}</Label>
                                    <Input
                                        id="deduction"
                                        type="number"
                                        value={editingBracket.deduction}
                                        onChange={(e) =>
                                            setEditingBracket({
                                                ...editingBracket,
                                                deduction: parseInt(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            {typeof editingBracket.max === "number" && (
                                <div className="p-3 rounded-lg bg-muted text-sm">
                                    <p className="font-medium mb-1">{t("payrollTaxBracketsFormula")}</p>
                                    <p className="font-mono text-xs">
                                        {t("payrollTaxBracketsFormulaExpression", {
                                            rate: formatRate(editingBracket.rate),
                                            deduction: formatCurrency(editingBracket.deduction),
                                        })}
                                    </p>
                                    <p className="text-muted-foreground mt-1">
                                        {t("payrollTaxBracketsApplyRange", {
                                            min: formatCurrency(editingBracket.min),
                                            max: formatCurrency(editingBracket.max),
                                        })}
                                    </p>
                                </div>
                            )}

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingBracket(null)}
                                >
                                    {t("payrollCancel")}
                                </Button>
                                <Button onClick={() => handleSaveBracket(editingBracket)}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {t("payrollSave")}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}

