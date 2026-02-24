import { useMemo } from "react";
import { useCookie } from "react-use";

export const useObjectCookie = <T>(
    key: string,
    fallback?: T | null,
): [T, (newVal: T) => void] => {
    const [valStr, updateCookie] = useCookie(key);

    const value = useMemo<T>(
        () => (valStr ? JSON.parse(valStr) : fallback),
        [fallback, valStr],
    );

    const updateValue = (newVal: T) => {
        updateCookie(JSON.stringify(newVal));
    };

    return [value, updateValue];
};
