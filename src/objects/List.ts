import * as vscode from 'vscode';

export class List implements vscode.QuickPickItem {
    label: string;
    description: string;
    value: string;
    detail: string;

    constructor(label: string, description: string, value: string, detail: string) {
        this.label = label;
        this.description = description;
        this.value = value;
        this.detail = detail;
    }
}