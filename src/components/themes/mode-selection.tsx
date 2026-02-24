"use client";

import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useMounted } from "@mantine/hooks";
import { Mode, useSettings } from "@/contexts/settings-context";

const tabsAppearance: {
    label: string;
    value: Mode;
    icon: React.ReactNode;
}[] = [
    {
        label: "Sáng",
        value: "light",
        icon: (
            <div className="w-20 h-12 rounded-lg border border-border bg-white" />
        ),
    },
    {
        label: "Tối",
        value: "dark",
        icon: (
            <div className="w-20 h-12 rounded-lg border border-border bg-black" />
        ),
    },
    {
        label: "Hệ thống",
        value: "system",
        icon: (
            <div className="w-20 h-12 rounded-lg border border-border overflow-hidden relative">
                <div className="absolute inset-0 bg-black [clip-path:polygon(0_0,100%_0,0_100%)]"></div>

                <div className="absolute inset-0 bg-white [clip-path:polygon(100%_0,100%_100%,0_100%)] "></div>
            </div>
        ),
    },
];

const ModeSelection = () => {
    const mounted = useMounted();

    const { setTheme } = useTheme();
    const { settings, updateSettings } = useSettings();

    const handleModeChange = (value: string) => {
        if (value) {
            const newMode = value as Mode;

            const updatedSettings = {
                ...settings,
                mode: newMode,
                theme: {
                    ...settings.theme,
                    styles: {
                        light: settings.theme.styles?.light || {},
                        dark: settings.theme.styles?.dark || {},
                    },
                },
            };

            updateSettings(updatedSettings);
            setTheme(newMode);
        }
    };

    if (!mounted) return null;

    return (
        <Tabs value={settings.mode} onValueChange={handleModeChange}>
            <TabsList className="bg-transparent w-full group-data-[orientation=horizontal]/tabs:h-full gap-2 justify-between">
                {tabsAppearance.map(({ icon, value, label }) => (
                    <div
                        key={value}
                        className="flex flex-col items-center gap-2"
                    >
                        <TabsTrigger
                            value={value}
                            className="h-14 w-fit px-px py-px data-[state=active]:shadow-none data-[state=active]:ring-primary data-[state=active]:ring-2 ring-offset-0 rounded-lg"
                        >
                            <div className="w-20 h-12 flex items-center justify-center rounded-md bg-muted/50">
                                {icon}
                            </div>
                        </TabsTrigger>
                        <p className="text-xs">{label}</p>
                    </div>
                ))}
            </TabsList>
        </Tabs>
    );
};

export default ModeSelection;
