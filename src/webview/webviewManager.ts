import { ExtensionContext, Uri, ViewColumn, window } from "vscode";
import { readFileSync } from "fs";
import { DataTableConfig, Variable } from "../models/Variable";
import { Configuration } from "../config/configuration";
import path = require("path");
import { NotificationManager } from "../utilities/NotificationManager";
import { Logger } from "../utilities/Logger";
import { MessageType } from "../constants/messages";
import { OnHeaderReady } from "../providers/dataTableProvider";
import { OnBatchReady } from "../providers/dataTableRows";

export class WebViewHelper {

    /**
     * Create web view
     * @param context Current context of extension
     * @param variable Variable
     * @param onGetData Callback to fetch data with config
     * @param onRefresh Callback to refresh data
     */
    public createWebView(
        context: ExtensionContext,
        variable: Variable,
        onGetData: (config: DataTableConfig, variable: Variable, onHeaderReady: OnHeaderReady | null, onBatchReady: OnBatchReady | null) => Promise<Variable>,
        onRefresh: (variable: Variable, onHeaderReady: OnHeaderReady | null, onBatchReady: OnBatchReady | null) => Promise<Variable>
    ) {
        const panel = window.createWebviewPanel(
            'csharp-debug-visualizer',
            'Visualize',
            ViewColumn.Two,
            {
                enableScripts: true,
                enableFindWidget: true,
                localResourceRoots: [Uri.file(path.join(context.extensionPath, 'web'))]
            }
        );
        panel.webview.html = this.getHtml(context);
        const createStreamCallbacks = () => {
            const onHeaderReady: OnHeaderReady = (header) => {
                panel.webview.postMessage({ command: 'setHeader', data: header });
            };
            const onBatchReady = (rows: string[][], startIndex: number) => {
                panel.webview.postMessage({ command: 'appendRows', data: { rows, startIndex } });
            };
            return { onHeaderReady, onBatchReady };
        };

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case "getData":
                        if (message.text) {
                            let config: DataTableConfig;
                            try {
                                config = JSON.parse(message.text);
                            } catch {
                                NotificationManager.showMessage("Failed to parse configuration.", MessageType.error);
                                return;
                            }
                            const { onHeaderReady, onBatchReady } = createStreamCallbacks();
                            onGetData(config, variable, onHeaderReady, onBatchReady).then((_variable) => {
                                variable = _variable;
                                panel.webview.postMessage({ command: 'fetchComplete' });
                            }).catch((error) => {
                                Logger.error("getData (with config) failed", error);
                                const errMsg = error?.message ?? "Failed to get data.";
                                NotificationManager.showMessage(errMsg, MessageType.error);
                                panel.webview.postMessage({ command: 'showError', varName: variable.varName, message: errMsg });
                            });
                        } else {
                            panel.webview.postMessage({ command: 'setData', data: variable });
                        }
                        return;
                    case "refreshData":
                        const streamCbs = createStreamCallbacks();
                        onRefresh(variable, streamCbs.onHeaderReady, streamCbs.onBatchReady).then((_variable) => {
                            variable = _variable;
                            panel.webview.postMessage({ command: 'fetchComplete' });
                        }).catch((error) => {
                            Logger.error("refreshData failed", error);
                            const errMsg = error?.message ?? "Failed to refresh data.";
                            NotificationManager.showMessage(errMsg, MessageType.error);
                            panel.webview.postMessage({ command: 'showError', varName: variable.varName, message: errMsg });
                        });
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    }

    /**
     * Returns combine data of html, css and js to show output
     * @param context Current context of extension
     * @returns Combined data of HTML, CSS & JS
     */
    public getHtml(context: ExtensionContext): string {
        let htmlData: string;
        let cssData: string;
        let jsData: string;
        try {
            htmlData = readFileSync(path.join(context.extensionPath, 'web', 'index.html'), 'utf-8');
            cssData = readFileSync(path.join(context.extensionPath, 'web', 'style.css'), 'utf-8');
            jsData = readFileSync(path.join(context.extensionPath, 'web', 'script.js'), 'utf-8');
        } catch {
            throw new Error("Failed to load webview resources. Please reinstall the extension.");
        }
        let finalData = htmlData.replace("#css", this.getCss(cssData));
        finalData = finalData.replace("#js", this.getJs(jsData));
        return finalData;
    }

    /**
     * Wraps css data in \<style\> tag
     * @param cssData Css Data as string
     * @returns Wrapped css data inside \<style\>
     */
    public getCss(cssData: string): string {
        cssData = cssData.replace("#themeColor", Configuration.colorTheme);
        return `
            <style>
                ${cssData}
            </style>
        `;
    }

    /**
     * Wraps js data in \<script\> tag
     * @param jsData Js Data as string
     * @returns Wrapped js data inside \<script\>
     */
    public getJs(jsData: string): string {
        return `
            <script>
                ${jsData}
            </script>
        `;
    }
}
