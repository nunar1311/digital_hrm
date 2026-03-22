import type { Metadata } from "next";
import PositionsClient from "./positions-client";

export const metadata: Metadata = {
    title: "Quản lý chức vụ | Digital HRM",
};

export default function PositionsPage() {
    return <PositionsClient />;
}
