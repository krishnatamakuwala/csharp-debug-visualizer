import { ExtensionContext, Uri, ViewColumn, window } from "vscode";
import { readFileSync } from "fs";
import { Variable } from "../Models/Variable";
import { Configuration } from "../Models/Configuration";
import path = require("path");

export class WebViewHelper {
    /**
     * Create web view
     * @param context Current context of extension
     */
    public createWebView(context: ExtensionContext, variable: Variable) {
        const panel = window.createWebviewPanel(
            'csharp-debug-visualizer',
            'Visualize',
            ViewColumn.Two,
            {
                enableScripts: true,
                enableFindWidget: true,
                localResourceRoots: [Uri.file(path.join(context.extensionPath, 'src', 'Web'))]
            }
        );
        panel.webview.html = this.getHtml(context);
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case "getData":
                        panel.webview.postMessage({ command: 'setData', data: variable });
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
        let htmlData = readFileSync(path.join(context.extensionPath, 'src', 'Web', 'index.html'), 'utf-8');
        let cssData = readFileSync(path.join(context.extensionPath, 'src', 'Web', 'style.css'), 'utf-8');
        let jsData = readFileSync(path.join(context.extensionPath, 'src', 'Web', 'script.js'), 'utf-8');
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