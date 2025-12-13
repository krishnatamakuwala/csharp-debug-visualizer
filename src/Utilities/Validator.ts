import { InvalidRecordsPerPageError, InvalidThemeError } from "../Extensions/Errors";
import { RecordsPerPage, Themes } from "../Models/Configuration";

export class Validator {

    /**
     * Validates theme color
     * @param colorThemeName Color theme name
     * @returns Color theme if valid else throws an error
     */
    public static validateThemeColor(colorThemeName: string | undefined): string {
        if (colorThemeName === undefined) {
            throw new InvalidThemeError();
        }
        const colorTheme = Themes.themes.filter(x => x.themeName === colorThemeName)[0].hexCode;
        if (colorTheme === undefined || colorTheme === null) {
            throw new InvalidThemeError();
        } else {
            return colorTheme;
        }
    }

    /**
     * Validates records per page
     * @param recordsPerPage Records Per Page
     * @returns Records per page if valid else throws an error
     */
    public static validateRecordsPerPage(recordsPerPage: string | undefined): number {
        if (recordsPerPage === undefined || !RecordsPerPage.arrRecordPerPage.includes(recordsPerPage)) {
            throw new InvalidRecordsPerPageError();
        } else {
            if (recordsPerPage === "All") {
                return 0;
            }
            return parseInt(recordsPerPage);
        }
    }
}