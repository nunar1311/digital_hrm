import { Role, Permission, ROLE_PERMISSIONS } from "./permissions";

export function hasPermission(
    role: Role,
    permission: Permission,
): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
    role: Role,
    permissions: Permission[],
): boolean {
    return permissions.some((perm) => hasPermission(role, perm));
}

export function hasAllPermissions(
    role: Role,
    permissions: Permission[],
): boolean {
    return permissions.every((perm) => hasPermission(role, perm));
}

export function getUserPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}

export function canAccessRoute(
    role: Role,
    routePermissions: Permission[],
): boolean {
    if (role === Role.SUPER_ADMIN) return true;
    return hasAnyPermission(role, routePermissions);
}
