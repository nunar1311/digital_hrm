"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCompanyInfoForClient, updateCompanyInfo, uploadCompanyLogo, deleteCompanyLogo } from "./actions";
import type { CompanyInfo } from "./actions";

export function useCompanyInfo() {
    return useQuery({
        queryKey: ["company"],
        queryFn: async () => {
            const result = await getCompanyInfoForClient();
            return result;
        },
    });
}

export function useUpdateCompanyInfo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<CompanyInfo>) => {
            return await updateCompanyInfo(data);
        },
        onSuccess: () => {
            toast.success("Lưu thông tin công ty thành công");
            queryClient.invalidateQueries({ queryKey: ["company"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Không thể lưu thông tin công ty");
        },
    });
}

export function useUploadCompanyLogo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            return await uploadCompanyLogo(formData);
        },
        onSuccess: (result) => {
            toast.success("Tải logo lên thành công");
            queryClient.invalidateQueries({ queryKey: ["company"] });
            return result;
        },
        onError: (error: Error) => {
            toast.error(error.message || "Không thể tải logo lên");
        },
    });
}

export function useDeleteCompanyLogo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            return await deleteCompanyLogo();
        },
        onSuccess: () => {
            toast.success("Đã xóa logo");
            queryClient.invalidateQueries({ queryKey: ["company"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Không thể xóa logo");
        },
    });
}