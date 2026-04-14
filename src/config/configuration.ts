import { Disposable, workspace } from "vscode";
import { Validator } from "../utilities/Validator";
import { Logger } from "../utilities/Logger";

/**
 * Available color themes
 */
export interface ITheme {
    themeName: string;
    hexCode: string;
}

export const AVAILABLE_THEMES: ITheme[] = [
    { themeName: "Oceanic Breeze", hexCode: "#76ABAE" },
    { themeName: "Carbon Mist", hexCode: "#797979" },
    { themeName: "Dreamscapes", hexCode: "#80669D" },
    { themeName: "Rosy Blush", hexCode: "#DD7973" },
    { themeName: "Spring Serenity", hexCode: "#5DBEA3" },
    { themeName: "Sunburst Glow", hexCode: "#E8B53C" }
];

export const VALID_RECORDS_PER_PAGE: string[] = ["5", "10", "20", "25", "50", "All"];

const DEFAULT_RECORDS_PER_PAGE = 10;
const DEFAULT_COLOR_THEME = "#76ABAE";

/**
 * Encapsulated configuration manager — reads from VS Code workspace settings.
 * Replaces the old mutable-statics pattern.
 */
export class Configuration {
    private static _recordsPerPage: number = DEFAULT_RECORDS_PER_PAGE;
    private static _colorTheme: string = DEFAULT_COLOR_THEME;
    private static _configWatcher: Disposable | undefined;

    static get recordsPerPage(): number {
        return Configuration._recordsPerPage;
    }

    static get colorTheme(): string {
        return Configuration._colorTheme;
    }

    /**
     * Start watching for configuration changes.
     * Call once during extension activation.
     */
    static watch(): Disposable {
        Configuration.configure();
        if (!Configuration._configWatcher) {
            Configuration._configWatcher = workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("csharpDebugVisualizer")) {
                    Logger.info("Configuration changed — reloading settings.");
                    Configuration.configure();
                }
            });
        }
        return Configuration._configWatcher;
    }

    /**
     * Load configuration from VS Code workspace settings
     */
    static configure(): void {
        const cfg = workspace.getConfiguration("csharpDebugVisualizer");

        try {
            const rpp: number | undefined = cfg.get("recordsPerPage");
            Configuration._recordsPerPage = Validator.validateRecordsPerPage(rpp?.toString());
        } catch (error) {
            Logger.warn(`Invalid recordsPerPage setting — falling back to default (${DEFAULT_RECORDS_PER_PAGE}).`, error);
            Configuration._recordsPerPage = DEFAULT_RECORDS_PER_PAGE;
        }

        try {
            const theme: string | undefined = cfg.get("colorTheme");
            Configuration._colorTheme = Validator.validateThemeColor(theme);
        } catch (error) {
            Logger.warn(`Invalid colorTheme setting — falling back to default (${DEFAULT_COLOR_THEME}).`, error);
            Configuration._colorTheme = DEFAULT_COLOR_THEME;
        }
    }
}
