import { Role, Permission, ROLE_PERMISSIONS } from "./permissions";

export function hasPermission(
    role: Role,
    permission: Permission,
): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasPermissionWithCustom(
    role: Role,
    permission: Permission,
    customPermissions: string[] = [],
): boolean {
    if (role === Role.SUPER_ADMIN) return true;
    if (hasPermission(role, permission)) return true;
    return customPermissions.includes(permission as string);
}

export function hasAnyPermission(
    role: Role,
    permissions: Permission[],
): boolean {
    return permissions.some((perm) => hasPermission(role, perm));
}

export function hasAnyPermissionWithCustom(
    role: Role,
    permissions: Permission[],
    customPermissions: string[] = [],
): boolean {
    if (role === Role.SUPER_ADMIN) return true;
    return permissions.some(
        (perm) =>
            hasPermission(role, perm) ||
            customPermissions.includes(perm as string),
    );
}

export function hasAllPermissions(
    role: Role,
    permissions: Permission[],
): boolean {
    return permissions.every((perm) => hasPermission(role, perm));
}

export function hasAllPermissionsWithCustom(
    role: Role,
    permissions: Permission[],
    customPermissions: string[] = [],
): boolean {
    if (role === Role.SUPER_ADMIN) return true;
    return permissions.every(
        (perm) =>
            hasPermission(role, perm) ||
            customPermissions.includes(perm as string),
    );
}

export function getUserPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}

export function getUserEffectivePermissions(
    role: Role,
    customPermissions: string[] = [],
): Permission[] {
    if (role === Role.SUPER_ADMIN) {
        return Object.values(Permission);
    }
    const fixed = new Set(ROLE_PERMISSIONS[role] ?? []);
    for (const p of customPermissions) {
        if (Object.values(Permission).includes(p as Permission)) {
            fixed.add(p as Permission);
        }
    }
    return Array.from(fixed);
}

export function canAccessRoute(
    role: Role,
    routePermissions: Permission[],
): boolean {
    if (role === Role.SUPER_ADMIN) return true;
    return hasAnyPermission(role, routePermissions);
}

export function canAccessRouteWithCustom(
    role: Role,
    routePermissions: Permission[],
    customPermissions: string[] = [],
): boolean {
    if (role === Role.SUPER_ADMIN) return true;
    return hasAnyPermissionWithCustom(role, routePermissions, customPermissions);
}
