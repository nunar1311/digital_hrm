import * as Icons from "lucide-react";
import React from "react";

interface DynamicIconProps extends Icons.LucideProps {
    iconName: string;
}

const DynamicIcon = ({ iconName, ...props }: DynamicIconProps) => {
    const Icon = Icons[
        iconName as keyof typeof Icons
    ] as React.FC<Icons.LucideProps>;

    if (!Icon) return null;

    return <Icon {...props} />;
};

export default DynamicIcon;
