import { ExtensionContext, Uri, ViewColumn, window } from "vscode";
import { readFileSync } from "fs";
import { DataTableConfig, Variable } from "../Models/Variable";
import { Configuration } from "../Models/Configuration";
import path = require("path");
import { getResultWithConfig, refreshData } from "../extension";

export class WebViewHelper {
    
    /**
     * Create web view
     * @param context Current context of extension
     * @param variable Variable
     */
    public createWebView(context: ExtensionContext, variable: Variable) {
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
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case "getData":
                        if (message.text) {
                	        const config: DataTableConfig = JSON.parse(message.text);
                            getResultWithConfig(config, variable).then((_variable) => {
                                panel.webview.postMessage({ command: 'setData', data: _variable });
                            });
                        } else {
                            panel.webview.postMessage({ command: 'setData', data: variable });
                        }
                        return;
                    case "refreshData":
                        refreshData(variable).then((_variable) => {
                            panel.webview.postMessage({ command: 'setData', data: _variable });
                        });
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
        let htmlData = readFileSync(path.join(context.extensionPath, 'web', 'index.html'), 'utf-8');
        let cssData = readFileSync(path.join(context.extensionPath, 'web', 'style.css'), 'utf-8');
        let jsData = readFileSync(path.join(context.extensionPath, 'web', 'script.js'), 'utf-8');
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