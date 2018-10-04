import * as vscode from 'vscode';

export class List implements vscode.QuickPickItem {
    label: string;
    description: string;
    value: string;

    constructor(label: string, description: string, value: string) {
        this.label = label;
        this.description = description;
        this.value = value;
    }
}