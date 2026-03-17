import SettingSidebar from "@/components/settings/setting-sidebar";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";

const SettingsLayout = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <SidebarProvider className="h-full">
            <div className="flex-1 flex overflow-hidden relative">
                <SettingSidebar />
                <SidebarInset className="flex-1 overflow-hidden">
                    {children}
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

export default SettingsLayout;
