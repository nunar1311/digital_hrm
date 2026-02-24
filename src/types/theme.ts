export type ThemeStyleProps = {
    background: string;
    foreground: string;
    card: string;
    "card-foreground": string;
    popover: string;
    "popover-foreground": string;
    primary: string;
    "primary-foreground": string;
    secondary: string;
    "secondary-foreground": string;
    muted: string;
    "muted-foreground": string;
    accent: string;
    "accent-foreground": string;
    destructive: string;
};

export type ThemeMetadata = {
    badge?: string;
};

export type ThemeStyles = {
    light: ThemeStyleProps;
    dark: Partial<ThemeStyleProps>;
    css?: Record<string, Record<string, string>>;
    meta?: ThemeMetadata;
};

export type ThemeEditorState = {
    styles: ThemeStyles;
};

export type ThemePreset = {
    light?: Partial<ThemeStyleProps>;
    dark?: Partial<ThemeStyleProps>;
    css?: Record<string, Record<string, string>>;
    meta?: ThemeMetadata;
};
