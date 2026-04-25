import type {
  GridItemHTMLElement,
  GridStack,
  GridStackOptions,
  GridStackWidget,
} from "gridstack";
import {
  type PropsWithChildren,
  useCallback,
  useState,
  useMemo,
  useRef,
} from "react";
import { GridStackContext } from "../contexts/grid-stack-context";
import {
  saveDashboardLayout,
  resetDashboardLayout,
} from "@/app/(protected)/dashboard/dashboard-layout-actions";
import { getWidgetType } from "@/components/dashboard/widget-registry";
import type { SavedWidget } from "@/components/dashboard/widget-registry";
import { toast } from "sonner";

export function GridStackProvider({
  children,
  initialOptions,
  editMode = false,
  savedLayout = null,
}: PropsWithChildren<{
  initialOptions: GridStackOptions;
  editMode?: boolean;
  savedLayout?: GridStackWidget[] | null;
}>) {
  const [gridStack, setGridStack] = useState<GridStack | null>(null);

  // initialOptions.children already contains the correct layout
  // (built from savedLayout or DEFAULT_LAYOUT by buildGridStackChildren)
  // savedLayout prop is only used to indicate if user has a custom layout

  const modifiedOptions = useMemo(
    () => ({
      ...initialOptions,
    }),
    [initialOptions],
  );

  const [rawWidgetMetaMap, setRawWidgetMetaMap] = useState(() => {
    const map = new Map<string, GridStackWidget>();
    const deepFindNodeWithContent = (obj: GridStackWidget) => {
      if (obj.id && obj.content) {
        map.set(obj.id, obj);
      }
      if (obj.subGridOpts?.children) {
        obj.subGridOpts.children.forEach((child: GridStackWidget) => {
          deepFindNodeWithContent(child);
        });
      }
    };
    initialOptions.children?.forEach((child: GridStackWidget) => {
      deepFindNodeWithContent(child);
    });
    return map;
  });

  const addWidget = useCallback(
    (widget: GridStackWidget & { id: Required<GridStackWidget>["id"] }) => {
      gridStack?.addWidget(widget);
      setRawWidgetMetaMap((prev) => {
        const newMap = new Map<string, GridStackWidget>(prev);
        newMap.set(widget.id, widget);
        return newMap;
      });
      // Save to DB after adding widget
      setTimeout(() => saveOptionsRef.current?.(), 500);
    },
    [gridStack],
  );

  const addSubGrid = useCallback(
    (
      subGrid: GridStackWidget & {
        id: Required<GridStackWidget>["id"];
        subGridOpts: Required<GridStackWidget>["subGridOpts"] & {
          children: Array<
            GridStackWidget & { id: Required<GridStackWidget>["id"] }
          >;
        };
      },
    ) => {
      gridStack?.addWidget(subGrid);
      setRawWidgetMetaMap((prev) => {
        const newMap = new Map<string, GridStackWidget>(prev);
        subGrid.subGridOpts?.children?.forEach(
          (meta: GridStackWidget & { id: Required<GridStackWidget>["id"] }) => {
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
      const element = document.body.querySelector<GridItemHTMLElement>(
        `[gs-id="${id}"]`,
      );
      if (element) gridStack?.removeWidget(element);
      setRawWidgetMetaMap((prev) => {
        const newMap = new Map<string, GridStackWidget>(prev);
        newMap.delete(id);
        return newMap;
      });
      // Save to DB after removing widget
      setTimeout(() => saveOptionsRef.current?.(), 500);
    },
    [gridStack],
  );

  // Debounce timer for saving to DB
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveOptionsRef = useRef<(() => void) | null>(null);

  const saveOptions = useCallback(() => {
    const result = gridStack?.save(true, true, (_, widget) => widget);
    if (!result) return result;

    // gridStack.save(true, true, cb) returns GridStackOptions object
    // with a children[] array, NOT a flat array
    const widgets: GridStackWidget[] = Array.isArray(result)
      ? result
      : ((result as GridStackOptions).children ?? []);

    if (widgets.length > 0) {
      // ★ Strip to minimal data: only widgetType + position
      const minimalWidgets: SavedWidget[] = widgets.map((w) => ({
        widgetType: getWidgetType(w.id ?? ""),
        x: w.x ?? 0,
        y: w.y ?? 0,
        w: w.w ?? 3,
        h: w.h ?? 3,
      }));

      // Debounce save to DB (500ms)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(async () => {
        try {
          await saveDashboardLayout(minimalWidgets);
        } catch (error) {
          console.error("[GridStackProvider] Failed to save layout:", error);
        }
      }, 500);
    }
    return result;
  }, [gridStack]);

  // Keep ref always pointing to latest saveOptions
  saveOptionsRef.current = saveOptions;

  const syncWidgetMetaMap = useCallback((widgets: GridStackWidget[]) => {
    const map = new Map<string, GridStackWidget>();
    const deepFindNodeWithContent = (obj: GridStackWidget) => {
      if (obj.id && obj.content) {
        map.set(obj.id, obj);
      }
      if (obj.subGridOpts?.children) {
        obj.subGridOpts.children.forEach((child: GridStackWidget) => {
          deepFindNodeWithContent(child);
        });
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

  const resetLayout = useCallback(async () => {
    try {
      await resetDashboardLayout();
      window.location.reload();
    } catch {
      toast.error("Không thể đặt lại bố cục dashboard");
    }
  }, []);

  return (
    <GridStackContext.Provider
      value={{
        initialOptions: modifiedOptions,
        savedLayout: savedLayout ?? null,
        gridStack,
        editMode,
        addWidget,
        removeWidget,
        addSubGrid,
        saveOptions,
        loadLayout,
        syncWidgetMetaMap,
        removeAll,
        resetLayout,
        _gridStack: { value: gridStack, set: setGridStack },
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
