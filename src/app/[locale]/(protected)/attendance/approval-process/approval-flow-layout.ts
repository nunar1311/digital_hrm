import type { ApprovalStep } from "../types";

export interface IndexedStep {
    step: ApprovalStep;
    index: number;
}

export interface FlowBranch {
    condition: ApprovalStep;
    conditionIndex: number;
    approvers: IndexedStep[];
}

export interface ParsedApprovalFlow {
    preApprovers: IndexedStep[];
    branches: FlowBranch[];
    postApprovers: IndexedStep[];
}

/** Chuyển danh sách bước tuyến tính thành cấu trúc hiển thị: tiền xử lý → các nhánh (điều kiện + người duyệt) → hậu xử lý */
export function parseApprovalFlowSteps(steps: ApprovalStep[]): ParsedApprovalFlow {
    const preApprovers: IndexedStep[] = [];
    const branches: FlowBranch[] = [];
    const postApprovers: IndexedStep[] = [];

    let i = 0;

    while (i < steps.length && steps[i].stepType === "APPROVER") {
        preApprovers.push({ step: steps[i], index: i });
        i++;
    }

    while (i < steps.length) {
        const s = steps[i];
        if (s.stepType === "CONDITION") {
            const conditionIndex = i;
            const condition = s;
            i++;
            const approvers: IndexedStep[] = [];
            while (i < steps.length && steps[i].stepType === "APPROVER") {
                approvers.push({ step: steps[i], index: i });
                i++;
            }
            branches.push({ condition, conditionIndex, approvers });
        } else {
            break;
        }
    }

    while (i < steps.length) {
        if (steps[i].stepType === "APPROVER") {
            postApprovers.push({ step: steps[i], index: i });
        }
        i++;
    }

    return { preApprovers, branches, postApprovers };
}
