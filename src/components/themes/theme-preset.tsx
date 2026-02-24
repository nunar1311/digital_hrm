import { presets } from "@/utils/theme-presets";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { ThemeStyleProps } from "@/types/theme";
import { defaultThemeState } from "@/config/theme";
import { useSettings } from "@/contexts/settings-context";

const ThemePreset = () => {
    const { settings, applyThemePreset } = useSettings();

    const presetNames = useMemo(() => {
        // First get all preset names
        const allPresets = Object.keys(presets);

        // Separate presets with badge and without badge
        const presetWithBadge = allPresets.filter(
            (name) => presets[name]?.meta?.badge,
        );
        const presetWithoutBadge = allPresets.filter(
            (name) => !presets[name]?.meta?.badge,
        );

        // Sort presets with badge by badge value
        presetWithBadge.sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" }),
        );
        presetWithoutBadge.sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" }),
        );

        return [
            "default",
            ...presetWithBadge,
            ...presetWithoutBadge.filter(
                (name) => name !== "default",
            ),
        ];
    }, []);

    const value = presetNames?.find(
        (name) => name === settings.theme.preset,
    );

    const getThemeColor = (
        themeName: string,
        color: keyof ThemeStyleProps,
    ) => {
        const theme =
            themeName === "default"
                ? defaultThemeState
                : presets[themeName];

        return theme?.[
            settings.mode === "system" ? "light" : settings.mode
        ]?.[color];
    };
    return (
        <Tabs value={value || ""} onValueChange={applyThemePreset}>
            <TabsList className="bg-transparent w-full group-data-[orientation=horizontal]/tabs:h-full gap-2 justify-between grid md:grid-cols-6 lg:grid-cols-6">
                {presetNames.map((name) => {
                    return (
                        <div
                            key={name}
                            className="flex flex-col items-center gap-2"
                        >
                            <TabsTrigger
                                value={name}
                                className="h-14 w-fit px-px py-px data-[state=active]:shadow-none data-[state=active]:ring-primary data-[state=active]:ring-2 ring-offset-0 rounded-[8px]"
                            >
                                <div className="flex items-center">
                                    <div
                                        className="relative size-8 rounded-sm p-1"
                                        style={{
                                            backgroundColor:
                                                getThemeColor(
                                                    name,
                                                    "primary",
                                                ),
                                        }}
                                    ></div>
                                </div>
                            </TabsTrigger>
                            <p className="text-xs capitalize">
                                {name}
                            </p>
                        </div>
                    );
                })}
            </TabsList>
        </Tabs>
    );
};

export default ThemePreset;
