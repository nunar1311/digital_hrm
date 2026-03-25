export { getSocket, disconnectSocket } from "./client";
export { SOCKET_EVENTS } from "./types";
export type {
    ServerToClientEvents,
    ClientToServerEvents,
    AttendanceCheckInEvent,
    AttendanceCheckOutEvent,
    AttendanceUpdatedEvent,
    OvertimeRequestEvent,
    OvertimeApprovedEvent,
    ExplanationSubmittedEvent,
    ExplanationApprovedEvent,
    ShiftUpdatedEvent,
    ShiftAssignedEvent,
    ConfigUpdatedEvent,
    AdjustmentRequestedEvent,
    AdjustmentApprovedEvent,
    AdjustmentRejectedEvent,
    AdjustmentAutoApprovedEvent,
} from "./types";
