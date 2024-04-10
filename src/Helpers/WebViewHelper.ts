import { ExtensionContext, Uri, ViewColumn, window } from "vscode";
import { readFile, readFileSync } from "fs";
import path = require("path");

export class WebViewHelper {
    /**
     * Create web view
     * @param context Current context of extension
     */
    public createWebView(context: ExtensionContext) {
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
    }

    /**
     * Returns combine data of html, css and js to show output
     * @param context Current context of extension
     * @returns Combined data of HTML, CSS & JS
     */
    public getHtml(context: ExtensionContext) {
        let htmlData = readFileSync(path.join(context.extensionPath, 'src', 'Web', 'index.html'), 'utf-8');
        let cssData = readFileSync(path.join(context.extensionPath, 'src', 'Web', 'style.css'), 'utf-8');
        let finalData = htmlData.replace("#css", this.getCss(cssData));
        console.log(finalData);
        return finalData;
    }

    /**
     * Wraps css data in <style> tag
     * @param cssData Css Data as string
     * @returns Wrapped css data inside <style>
     */
    public getCss(cssData: string) {
        return `
            <style>
                ${cssData}
            </style>
        `;
    }
}