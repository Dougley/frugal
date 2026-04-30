/**
 * Type utilities for extracting translation keys from a translation object.
 * These types enable compile-time checking of translation key usage.
 */

/**
 * Helper type to track recursion depth and prevent infinite loops.
 */
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Recursively extracts all dot-notation paths from a nested object type.
 * Only includes paths that lead to string values (leaf nodes).
 * Limited to 10 levels of depth to prevent TypeScript compiler issues.
 *
 * @example
 * ```typescript
 * type Translations = {
 *   common: {
 *     errors: {
 *       not_found: string;
 *       unauthorized: string;
 *     };
 *   };
 *   commands: {
 *     ping: {
 *       name: string;
 *       description: string;
 *     };
 *   };
 * };
 *
 * type Keys = TranslationKeys<Translations>;
 * // "common.errors.not_found" | "common.errors.unauthorized" | "commands.ping.name" | "commands.ping.description"
 * ```
 */
export type TranslationKeys<T, Depth extends number = 10> = [Depth] extends [
  never,
]
  ? never
  : T extends string
    ? ""
    : T extends object
      ? {
          [K in keyof T & string]: T[K] extends string
            ? K
            : T[K] extends object
              ? `${K}.${TranslationKeys<T[K], Prev[Depth]>}`
              : never;
        }[keyof T & string]
      : never;

/**
 * Extracts the value type at a given dot-notation path in an object.
 *
 * @example
 * ```typescript
 * type Translations = {
 *   common: {
 *     errors: {
 *       not_found: string;
 *     };
 *   };
 * };
 *
 * type Value = PathValue<Translations, "common.errors.not_found">;
 * // string
 * ```
 */
export type PathValue<
  T,
  Path extends string,
> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? PathValue<T[Key], Rest>
    : never
  : Path extends keyof T
    ? T[Path]
    : never;

/**
 * Extracts ICU parameter names from a translation string.
 * Matches patterns like {name}, {count}, {date}, etc.
 *
 * @example
 * ```typescript
 * type Params = ExtractICUParams<"Hello {name}, you have {count} messages">;
 * // "name" | "count"
 * ```
 */
export type ExtractICUParams<S extends string> =
  S extends `${string}{${infer Param}}${infer Rest}`
    ? Param extends `${infer Name},${string}`
      ? Name | ExtractICUParams<Rest>
      : Param | ExtractICUParams<Rest>
    : never;

/**
 * Creates a record type for ICU parameters extracted from a string.
 * Parameters can be string, number, boolean, or Date.
 *
 * @example
 * ```typescript
 * type Params = ICUParamsFor<"Hello {name}, you have {count} messages">;
 * // { name: string | number | boolean | Date; count: string | number | boolean | Date }
 * ```
 */
export type ICUParamsFor<S extends string> =
  ExtractICUParams<S> extends never
    ? Record<string, never>
    : { [K in ExtractICUParams<S>]: string | number | boolean | Date };

/**
 * Helper type to check if an ICU parameter record is empty.
 */
export type IsEmptyParams<T> = keyof T extends never ? true : false;

/**
 * Options for typed translate method when parameters are required.
 */
export interface TypedTranslateOptionsWithParams<TParams> {
  params: TParams;
  language?: string;
}

/**
 * Options for typed translate method when no parameters are needed.
 */
export interface TypedTranslateOptionsNoParams {
  language?: string;
}

/**
 * Union type for translate options, determined by whether params are required.
 */
export type TypedTranslateOptions<TParams> =
  IsEmptyParams<TParams> extends true
    ? TypedTranslateOptionsNoParams | undefined
    : TypedTranslateOptionsWithParams<TParams>;
