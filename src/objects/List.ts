import * as vscode from 'vscode';

export class List implements vscode.QuickPickItem {

    constructor(
        public label: string,
        public description: string,
        public value: string,
        public detail: string,
        public paths: string[]
    ) {
    }
}