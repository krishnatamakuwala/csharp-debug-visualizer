import { workspace } from "vscode";
import { Validator } from "../Utilities/Validator";

/**
 * Configuration of web-view provided by user 
 */
class Configuration {
    public static recordsPerPage = 10;
    public static colorTheme = "#76ABAE";

    /**
     * Configure settings
     */
    public static configure() {
        Themes.configure();
        RecordsPerPage.configure();
    }
}

class RecordsPerPage {

    public static arrRecordPerPage: string[] = ["5", "10", "15", "20", "25", "All"];

    /**
     * Configure records per page
     */
    public static configure() {
        const recordsPerPage: number | undefined = workspace.getConfiguration("csharpDebugVisualizer").get("recordsPerPage");
        Configuration.recordsPerPage = Validator.validateRecordsPerPage(recordsPerPage?.toString());
    }
}

/**
 * Themes object containing theme name and its hex code
 */
class Themes {
    public static themes: IThemes[] = [
        { themeName: "Oceanic Breeze", hexCode: "#76ABAE" },
        { themeName: "Carbon Mist", hexCode: "#797979" },
        { themeName: "Dreamscapes", hexCode: "#80669D" },
        { themeName: "Rosy Blush", hexCode: "#DD7973" },
        { themeName: "Spring Serenity", hexCode: "#5DBEA3" },
        { themeName: "Sunburst Glow", hexCode: "#E8B53C" }
    ];

    /**
     * Configure hex code for current theme
     */
    public static configure() {
        const colorThemeName: string | undefined = workspace.getConfiguration("csharpDebugVisualizer").get("colorTheme");
        Configuration.colorTheme = Validator.validateThemeColor(colorThemeName);
    }
}

interface IThemes {
    themeName: string;
    hexCode: string;
}

export {
    Configuration,
    Themes,
    RecordsPerPage
};