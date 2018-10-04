'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { window, StatusBarAlignment, StatusBarItem, Uri } from 'vscode';
import { List } from './List';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "advpl-switch-project" is now active!');

    const status = window.createStatusBarItem(StatusBarAlignment.Right, 100);
    status.command = "extension.switchProject";
    let folder = vscode.workspace.getConfiguration("advpl").get("projectActive");

    if (folder) {
        status.text = folder.toString();
    } else {
        status.text = "Selecionar Projeto";
    }

    status.show();
    context.subscriptions.push(status);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.switchProject', () => {
        // The code you place here will be executed every time your command is executed
        // let teste = ["a", "b"];

        // vscode.window.showQuickPick(teste);

        //     // Display a message box to the user
        //     vscode.window.showInformationMessage('Hello World!');
        //     showWorkspaceFolderPick().then((a => {
        //            if (a) {
        //                console.log(a.name);
        //            }
        //     }));
        showFolders(status);
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function showFolders(status: StatusBarItem) {
    // let folders = [
    //     {
    //         "path": "Branches\\ProtheusClean\\src",
    //         "name": "ProtheusClean"
    //     },
    //     {
    //         "path": "Branches\\Projeto_62_GPE\\src",
    //         "name": "Projeto_62_GPE"
    //     }
    //     ,
    //     {
    //         "path": "Branches\\Projeto_62_GPE\\src",
    //         "name": "BRA P12"
    //     }
    // ];

    let folders = vscode.workspace.getConfiguration("advpl").get<Array<Folder>>("foldersProject");
    let patches: Array<List> = [];

    if (folders) {
        for (let i = 0; i < folders.length; i++) {
            patches.push(
                new List(folders[i].name, "", folders[i].path)
            );
        }
    }

    window.showQuickPick(patches).then((a => {
        let _uri: Uri;

        if (a) {
            status.text = a.label;
            let updObj = vscode.workspace.getConfiguration("advpl");
            updObj.update("projectActive", a.label);

            _uri = vscode.Uri.parse("file:" + a.value);
            // _uri.with()

            if (vscode.workspace.updateWorkspaceFolders(0, 0, {
                uri: _uri, name: a.label
            })) {
                window.showInformationMessage("Projeto trocado para: " + a.label);
            }
        }

        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
            vscode.workspace.updateWorkspaceFolders(1, vscode.workspace.workspaceFolders.length-1);
        }

    }));
    // { scheme: "file", authority: "", path: "/./Branches\ProtheusClean\src", query: "", fragment: "", … }
}

export async function showWorkspaceFolderPick(): Promise<vscode.WorkspaceFolder | undefined> {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('This command requires an open folder.');
        return undefined;
    } else if (vscode.workspace.workspaceFolders.length === 1) {
        return vscode.workspace.workspaceFolders[0];
    }
    return await vscode.window.showWorkspaceFolderPick();
}