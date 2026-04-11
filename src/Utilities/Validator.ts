import { InvalidRecordsPerPageError, InvalidThemeError } from "../errors/errors";
import { AVAILABLE_THEMES, VALID_RECORDS_PER_PAGE } from "../config/configuration";

export class Validator {

    /**
     * Validates theme color
     * @param colorThemeName Color theme name
     * @returns Hex code if valid, else throws InvalidThemeError
     */
    public static validateThemeColor(colorThemeName: string | undefined): string {
        if (colorThemeName === undefined) {
            throw new InvalidThemeError();
        }
        const matchedTheme = AVAILABLE_THEMES.filter(x => x.themeName === colorThemeName);
        if (!matchedTheme.length || !matchedTheme[0].hexCode) {
            throw new InvalidThemeError();
        }
        return matchedTheme[0].hexCode;
    }

    /**
     * Validates records per page
     * @param recordsPerPage Records Per Page
     * @returns Numeric value if valid (0 = "All"), else throws InvalidRecordsPerPageError
     */
    public static validateRecordsPerPage(recordsPerPage: string | undefined): number {
        if (recordsPerPage === undefined || !VALID_RECORDS_PER_PAGE.includes(recordsPerPage)) {
            throw new InvalidRecordsPerPageError();
        }
        if (recordsPerPage === "All") {
            return 0;
        }
        return parseInt(recordsPerPage);
    }
}
