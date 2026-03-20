import type {
    GridItemHTMLElement,
    GridStack,
    GridStackOptions,
    GridStackWidget,
} from "gridstack";
import { type PropsWithChildren, useCallback, useState, useMemo } from "react";
import { GridStackContext } from "../contexts/grid-stack-context";

const STORAGE_KEY = "dashboard-grid-layout";

export function loadLayoutFromStorage(): GridStackWidget[] | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as GridStackWidget[];
    } catch {
        return null;
    }
}

export function saveLayoutToStorage(layout: GridStackWidget[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
        console.warn("Failed to save grid layout to localStorage");
    }
}

export function clearLayoutFromStorage() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
}

export function GridStackProvider({
    children,
    initialOptions,
    editMode = false,
}: PropsWithChildren<{
    initialOptions: GridStackOptions;
    editMode?: boolean;
}>) {
    const [gridStack, setGridStack] = useState<GridStack | null>(
        null,
    );

    // Load saved layout from localStorage
    const savedLayout = useMemo(() => {
        const loaded = loadLayoutFromStorage();
        return loaded?.length ? loaded : null;
    }, []);

    // Use savedLayout if available, otherwise use initialOptions.children
    const widgetsToUse = savedLayout || initialOptions.children;

    // Create modified options that use saved layout
    const modifiedOptions = useMemo(
        () => ({
            ...initialOptions,
            children: widgetsToUse,
        }),
        [initialOptions, widgetsToUse],
    );

    const [rawWidgetMetaMap, setRawWidgetMetaMap] = useState(() => {
        const map = new Map<string, GridStackWidget>();
        const deepFindNodeWithContent = (obj: GridStackWidget) => {
            if (obj.id && obj.content) {
                map.set(obj.id, obj);
            }
            if (obj.subGridOpts?.children) {
                obj.subGridOpts.children.forEach(
                    (child: GridStackWidget) => {
                        deepFindNodeWithContent(child);
                    },
                );
            }
        };
        widgetsToUse?.forEach((child: GridStackWidget) => {
            deepFindNodeWithContent(child);
        });
        return map;
    });

    const addWidget = useCallback(
        (
            widget: GridStackWidget & {
                id: Required<GridStackWidget>["id"];
            },
        ) => {
            gridStack?.addWidget(widget);
            setRawWidgetMetaMap((prev) => {
                const newMap = new Map<string, GridStackWidget>(prev);
                newMap.set(widget.id, widget);
                return newMap;
            });
        },
        [gridStack],
    );

    const addSubGrid = useCallback(
        (
            subGrid: GridStackWidget & {
                id: Required<GridStackWidget>["id"];
                subGridOpts: Required<GridStackWidget>["subGridOpts"] & {
                    children: Array<
                        GridStackWidget & {
                            id: Required<GridStackWidget>["id"];
                        }
                    >;
                };
            },
        ) => {
            gridStack?.addWidget(subGrid);

            setRawWidgetMetaMap((prev) => {
                const newMap = new Map<string, GridStackWidget>(prev);
                subGrid.subGridOpts?.children?.forEach(
                    (
                        meta: GridStackWidget & {
                            id: Required<GridStackWidget>["id"];
                        },
                    ) => {
                        newMap.set(meta.id, meta);
                    },
                );
                return newMap;
            });
        },
        [gridStack],
    );

    const removeWidget = useCallback(
        (id: string) => {
            const element =
                document.body.querySelector<GridItemHTMLElement>(
                    `[gs-id="${id}"]`,
                );
            if (element) gridStack?.removeWidget(element);

            setRawWidgetMetaMap((prev) => {
                const newMap = new Map<string, GridStackWidget>(prev);
                newMap.delete(id);
                return newMap;
            });
        },
        [gridStack],
    );

    const saveOptions = useCallback(() => {
        const layout = gridStack?.save(true, true, (_, widget) => widget);
        if (layout) {
            saveLayoutToStorage(layout as GridStackWidget[]);
        }
        return layout;
    }, [gridStack]);

    const syncWidgetMetaMap = useCallback((widgets: GridStackWidget[]) => {
        const map = new Map<string, GridStackWidget>();
        const deepFindNodeWithContent = (obj: GridStackWidget) => {
            if (obj.id && obj.content) {
                map.set(obj.id, obj);
            }
            if (obj.subGridOpts?.children) {
                obj.subGridOpts.children.forEach(
                    (child: GridStackWidget) => {
                        deepFindNodeWithContent(child);
                    },
                );
            }
        };
        widgets.forEach((child: GridStackWidget) => {
            deepFindNodeWithContent(child);
        });
        setRawWidgetMetaMap(map);
    }, []);

    const loadLayout = useCallback(
        (layout: GridStackWidget[]) => {
            if (!gridStack) return;
            gridStack.removeAll(false);
            setTimeout(() => {
                gridStack.load(layout);
                syncWidgetMetaMap(layout);
            }, 50);
        },
        [gridStack, syncWidgetMetaMap],
    );

    const removeAll = useCallback(() => {
        gridStack?.removeAll();
        setRawWidgetMetaMap(new Map<string, GridStackWidget>());
    }, [gridStack]);

    return (
        <GridStackContext.Provider
            value={{
                initialOptions: modifiedOptions,
                savedLayout,
                gridStack,
                editMode,

                addWidget,
                removeWidget,
                addSubGrid,
                saveOptions,
                loadLayout,
                syncWidgetMetaMap,
                removeAll,

                _gridStack: {
                    value: gridStack,
                    set: setGridStack,
                },
                _rawWidgetMetaMap: {
                    value: rawWidgetMetaMap,
                    set: setRawWidgetMetaMap,
                },
            }}
        >
            {children}
        </GridStackContext.Provider>
    );
}
