/**
 * Discriminated union for provider results.
 * Replaces loose `T | RequestStatusType.cancelled` unions for type safety.
 */
export type ProviderResult<T> =
    | { status: "success"; data: T }
    | { status: "cancelled" };

/** Helper to create a success result */
export function success<T>(data: T): ProviderResult<T> {
    return { status: "success", data };
}

/** Helper to create a cancelled result */
export function cancelled<T>(): ProviderResult<T> {
    return { status: "cancelled" };
}

/** Type guard to check if result is successful */
export function isSuccess<T>(result: ProviderResult<T>): result is { status: "success"; data: T } {
    return result.status === "success";
}
