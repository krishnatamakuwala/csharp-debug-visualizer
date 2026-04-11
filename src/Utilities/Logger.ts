import * as vscode from "vscode";

/**
 * Centralized logger using VS Code Output Channel.
 * Logs are visible in: View → Output → "C# Debug Visualizer"
 */
export class Logger {
    private static _channel: vscode.OutputChannel;

    private static get channel(): vscode.OutputChannel {
        if (!Logger._channel) {
            Logger._channel = vscode.window.createOutputChannel("C# Debug Visualizer");
        }
        return Logger._channel;
    }

    private static timestamp(): string {
        return new Date().toISOString();
    }

    public static info(message: string, data?: unknown): void {
        const line = `[${Logger.timestamp()}] [INFO] ${message}`;
        Logger.channel.appendLine(line);
        if (data !== undefined) {
            Logger.channel.appendLine(`  → ${JSON.stringify(data, null, 2)}`);
        }
    }

    public static warn(message: string, data?: unknown): void {
        const line = `[${Logger.timestamp()}] [WARN] ${message}`;
        Logger.channel.appendLine(line);
        if (data !== undefined) {
            Logger.channel.appendLine(`  → ${JSON.stringify(data, null, 2)}`);
        }
    }

    public static error(message: string, error?: unknown): void {
        const line = `[${Logger.timestamp()}] [ERROR] ${message}`;
        Logger.channel.appendLine(line);
        if (error instanceof Error) {
            Logger.channel.appendLine(`  → ${error.name}: ${error.message}`);
            if (error.stack) {
                Logger.channel.appendLine(`  → Stack: ${error.stack}`);
            }
        } else if (error !== undefined) {
            Logger.channel.appendLine(`  → ${JSON.stringify(error, null, 2)}`);
        }
    }

    public static show(): void {
        Logger.channel.show(true);
    }

    public static dispose(): void {
        if (Logger._channel) {
            Logger._channel.dispose();
        }
    }
}
