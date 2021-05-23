import {Uri} from 'vscode';

export class Project {
    uris: Uri[];
    name: string;

    constructor(uris: Uri[], label: string) {
        this.uris = uris;
        this.name = label;
    }
}