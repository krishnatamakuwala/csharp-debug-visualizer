import { workspace } from "vscode";
import { ErrorMessage } from "../Enums/Message";

/**
 * Configuration of web-view provided by user 
 */
class Configuration {
    public static totalPage = 0;
    public static currentPage = 1;
    public static colorTheme = "#76ABAE";
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
     * Get hex code for current theme
     */
    public static configureTheme() {
        const colorThemeName: string | undefined = workspace.getConfiguration("charpDebugVisualizer").get("colorTheme");
        if (colorThemeName === undefined) {
            throw Error(ErrorMessage.invalidTheme);
        }
        const colorTheme = Themes.themes.filter(x => x.themeName === colorThemeName)[0].hexCode;
        if (colorTheme === undefined || colorTheme === null) {
            throw Error(ErrorMessage.invalidTheme);
        } else {
            Configuration.colorTheme = colorTheme;
        }
    }
}

interface IThemes {
    themeName: string;
    hexCode: string;
}

export {
    Configuration,
    Themes
};