/**
 * Pure string manipulation utilities
 */
export class StringUtils {

    /**
     * Remove leading and trailing ""
     * @param str Input string
     * @returns Lead and trail removed string
     */
    public static removeLeadingAndTrailingQuotes(str: string) {
        if(str.startsWith("\"") && str.endsWith("\""))
        {
            str = str.slice(1, -1);
        }
        return str;
    }

    /**
     * Remove leading and trailing {}
     * @param str Input string
     * @returns Lead and trail removed string
     */
    public static removeLeadingAndTrailingCBraces(str: string) {
        if(str.startsWith("{") && str.endsWith("}"))
        {
            str = str.slice(1, -1);
        }
        return str;
    }
}
