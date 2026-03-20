import {
    PropsWithChildren,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useReducer,
} from "react";
import { useGridStackContext } from "../contexts/grid-stack-context";
import {
    GridStack,
    GridStackOptions,
    GridStackWidget,
} from "gridstack";
import { GridStackRenderContext } from "../contexts/grid-stack-render-context";
import isEqual from "react-fast-compare";
import { toast } from "@/utils/toast";

// WeakMap to store widget containers for each grid instance
export const gridWidgetContainersMap = new WeakMap<
    GridStack,
    Map<string, HTMLElement>
>();

export function GridStackRenderProvider({
    children,
}: PropsWithChildren) {
    const {
        _gridStack: { value: gridStack, set: setGridStack },
        initialOptions,
        editMode,
        saveOptions,
    } = useGridStackContext();

    const widgetContainersRef = useRef<Map<string, HTMLElement>>(
        new Map(),
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<GridStackOptions>(initialOptions);
    const gridInitializedRef = useRef(false);
    const [renderTick, forceRerender] = useReducer(
        (value) => value + 1,
        0,
    );

    const renderCBFn = useCallback(
        (
            element: HTMLElement,
            widget: GridStackWidget & { grid?: GridStack },
        ) => {
            console.log(
                "[GridStackRenderProvider] renderCB called for widget:",
                widget.id,
                "element:",
                !!element,
            );
            if (widget.id) {
                // Always store in local ref for backward compatibility
                widgetContainersRef.current.set(widget.id, element);

                // Also store in grid instance map if grid is available
                if (widget.grid) {
                    let containers = gridWidgetContainersMap.get(
                        widget.grid,
                    );
                    if (!containers) {
                        containers = new Map<string, HTMLElement>();
                        gridWidgetContainersMap.set(
                            widget.grid,
                            containers,
                        );
                    }
                    containers.set(widget.id, element);
                }

                // Force a re-render to ensure GridStackRender picks up the new container
                forceRerender();
            }
        },
        [],
    );

    const initGrid = useCallback(() => {
        if (containerRef.current) {
            GridStack.renderCB = renderCBFn;
            return GridStack.init(
                optionsRef.current,
                containerRef.current,
            );
            // ! Change event not firing on nested grids (resize, move...) https://github.com/gridstack/gridstack.js/issues/2671
            // .on("change", () => {
            //   console.log("changed");
            // })
            // .on("resize", () => {
            //   console.log("resize");
            // })
        }
        return null;
    }, [renderCBFn]);

    useLayoutEffect(() => {
        if (
            !isEqual(initialOptions, optionsRef.current) &&
            gridStack
        ) {
            // Options changed, need to recreate grid
            try {
                gridStack.removeAll(false);
                gridStack.destroy(false);
                widgetContainersRef.current.clear();
                gridWidgetContainersMap.delete(gridStack);
                optionsRef.current = initialOptions;
                gridInitializedRef.current = false;
                setGridStack(null);
            } catch (e) {
                console.error("Error reinitializing gridstack", e);
            }
        }
    }, [initialOptions, gridStack, setGridStack, initGrid]);

    // Toggle drag/resize and gs-static class based on editMode
    useEffect(() => {
        if (!gridStack) return;

        const items = gridStack.getGridItems();
        items.forEach((el) => {
            if (editMode) {
                el.classList.remove("gs-static");
            } else {
                el.classList.add("gs-static");
            }
        });

        if (editMode) {
            gridStack.enable();
        } else {
            gridStack.disable();
        }
    }, [editMode, gridStack]);

    // Ref to store previous layout for undo
    const previousLayoutRef = useRef<GridStackWidget[]>([]);

    // Save layout BEFORE drag/resize starts
    useEffect(() => {
        if (!gridStack || !editMode) return;

        const handleDragOrResizeStart = () => {
            const layout = gridStack.save() as GridStackWidget[];
            if (Array.isArray(layout)) {
                previousLayoutRef.current = layout;
            }
        };

        gridStack.on("dragstart", handleDragOrResizeStart);
        gridStack.on("resizestart", handleDragOrResizeStart);

        return () => {
            gridStack.off("dragstart");
            gridStack.off("resizestart");
        };
    }, [gridStack, editMode]);

    // Listen to GridStack change events and show undo toast
    useEffect(() => {
        if (!gridStack || !editMode) return;

        const handleChange = (
            _event: Event,
            items: GridStackWidget[],
        ) => {
            if (!items || items.length === 0) return;
            if (previousLayoutRef.current.length === 0) return;

            // Auto-save to localStorage
            saveOptions();

            toast("success", "Thay đổi bố cục", {
                action: {
                    label: "Hoàn tác",
                    onClick: () => {
                        const savedLayout = previousLayoutRef.current;
                        if (!savedLayout.length) {
                            console.log("[Undo] No saved layout");
                            return;
                        }

                        // Remove all and reload saved layout
                        gridStack.removeAll(false);

                        // Small delay to ensure remove is complete
                        setTimeout(() => {
                            gridStack.load(savedLayout);
                        }, 50);
                    },
                },
            });
        };

        gridStack.on("change", handleChange);

        return () => {
            gridStack.off("change");
        };
    }, [gridStack, editMode, saveOptions]);

    useLayoutEffect(() => {
        if (
            !gridStack &&
            containerRef.current &&
            !gridInitializedRef.current
        ) {
            gridInitializedRef.current = true;
            // Update optionsRef before init
            optionsRef.current = initialOptions;

            try {
                const grid = initGrid();

                if (grid) {
                    setGridStack(grid);
                }
            } catch (e) {
                console.error("Error initializing gridstack", e);
            }
        }
    }, [gridStack, initGrid, setGridStack, initialOptions]);

    return (
        <GridStackRenderContext.Provider
            value={useMemo(
                () => ({
                    getWidgetContainer: (widgetId: string) => {
                        // First try to get from the current grid instance's map
                        if (gridStack) {
                            const containers =
                                gridWidgetContainersMap.get(
                                    gridStack,
                                );
                            if (containers?.has(widgetId)) {
                                return (
                                    containers.get(widgetId) || null
                                );
                            }
                        }
                        // Fallback to local ref for backward compatibility
                        return (
                            widgetContainersRef.current.get(
                                widgetId,
                            ) || null
                        );
                    },
                    editMode,
                }),
                // ! gridStack is required to reinitialize the grid when the options change
                // eslint-disable-next-line react-hooks/exhaustive-deps
                [gridStack, renderTick, editMode],
            )}
        >
            <div ref={containerRef} className="grid-stack w-full">
                {children}
            </div>
        </GridStackRenderContext.Provider>
    );
}
