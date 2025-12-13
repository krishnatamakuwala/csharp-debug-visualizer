import { Progress } from "vscode";

export class MockProgress implements Progress<{ message?: string; increment?: number }> {
    public reports: Array<{ message?: string; increment?: number }> = [];

    report(value: { message?: string; increment?: number }): void {
        this.reports.push(value);
    }
}