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
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ["company"] });
            queryClient.setQueryData<Partial<CompanyInfo> | undefined>(["company"], (old) => {
                if (!old) return old;
                return { ...old, ...data };
            });
            return {};
        },
        onSuccess: () => {
            toast.success("Lưu thông tin công ty thành công");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Không thể lưu thông tin công ty");
            queryClient.invalidateQueries({ queryKey: ["company"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["company"] });
        }
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
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["company"] });
            queryClient.setQueryData<{ logo: string | null } | undefined>(["company"], (old) => {
                if (!old) return old;
                return { ...old, logo: null };
            });
            return {};
        },
        onSuccess: () => {
            toast.success("Đã xóa logo");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Không thể xóa logo");
            queryClient.invalidateQueries({ queryKey: ["company"] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["company"] });
        }
    });
}