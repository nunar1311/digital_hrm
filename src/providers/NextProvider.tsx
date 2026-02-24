import { ThemeProvider } from "next-themes";
import { ComponentProps } from "react";

const NextProvider = ({
    children,
    ...props
}: ComponentProps<typeof ThemeProvider>) => {
    return <ThemeProvider {...props}>{children}</ThemeProvider>;
};

export default NextProvider;
