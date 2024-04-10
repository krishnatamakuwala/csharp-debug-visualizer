/**
 * Configuration of web-view provided by user 
 */
class Configuration {
    public static totalPage = 0;
    public static currentPage = 1;
    public static theme = "test";
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
    public static getHexCode(themeName: string) {
        Themes.themes.filter(x => x.themeName === themeName)[0].hexCode;
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