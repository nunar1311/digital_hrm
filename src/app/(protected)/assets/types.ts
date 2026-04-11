// ─── Asset Module Types ───

export type AssetCategory =
    | "LAPTOP"
    | "PHONE"
    | "MONITOR"
    | "DESK"
    | "CHAIR"
    | "CARD"
    | "OTHER";

export type AssetStatus =
    | "AVAILABLE"
    | "ASSIGNED"
    | "MAINTENANCE"
    | "DISPOSED";

export type AssignmentStatus = "ASSIGNED" | "RETURNED";

export type AssetCondition = "GOOD" | "DAMAGED" | "LOST";

// ─── Response Types ───

export interface AssetBasic {
    id: string;
    name: string;
    code: string;
    category: AssetCategory;
    status: AssetStatus;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    purchaseDate: string | null;
    purchasePrice: number | null;
    warrantyEnd: string | null;
    location: string | null;
    description: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AssetWithCurrentUser extends AssetBasic {
    currentUserName: string | null;
    currentUserId: string | null;
    currentAssignmentId: string | null;
}

export interface AssetAssignmentBasic {
    id: string;
    assetId: string;
    assetName?: string;
    assetCode?: string;
    userId: string;
    userName: string;
    assignedBy: string | null;
    assignedByName: string | null;
    assignDate: string;
    expectedReturn: string | null;
    returnDate: string | null;
    returnedTo: string | null;
    returnedToName: string | null;
    status: AssignmentStatus;
    condition: string | null;
    notes: string | null;
    createdAt: string;
}

export interface AssetWithAssignments extends AssetBasic {
    assignments: AssetAssignmentBasic[];
}

// ─── Form Types ───

export interface CreateAssetForm {
    name: string;
    code: string;
    category: AssetCategory;
    brand?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    warrantyEnd?: string;
    location?: string;
    description?: string;
}

export interface UpdateAssetForm extends Partial<CreateAssetForm> {
    id: string;
    status?: AssetStatus;
}

export interface AssignAssetForm {
    assetId: string;
    userId: string;
    assignDate?: string;
    expectedReturn?: string;
    notes?: string;
}

export interface ReturnAssetForm {
    assignmentId: string;
    condition?: AssetCondition;
    notes?: string;
}

// ─── Filter & Stats Types ───

export interface AssetFilters {
    category?: AssetCategory | "";
    status?: AssetStatus | "";
    search?: string;
}

export interface AssetStats {
    totalAssets: number;
    availableAssets: number;
    assignedAssets: number;
    maintenanceAssets: number;
    disposedAssets: number;
    totalValue: number;
}

export interface UserOption {
    id: string;
    name: string;
    username: string | null;
    departmentName: string | null;
}
