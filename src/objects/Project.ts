import * as vscode from 'vscode';

export class Project {
    uri: vscode.Uri;
    name: string;

    constructor(uri: vscode.Uri, label: string) {
        this.uri = uri;
        this.name = label;
    }
}