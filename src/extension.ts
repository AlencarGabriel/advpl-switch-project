'use strict';

import * as vscode from 'vscode';
import { window } from 'vscode';
import { List } from './List';
import { StatusProject } from './StatusProject';

let status: StatusProject;

export function activate(context: vscode.ExtensionContext) {
    status = new StatusProject();
    status.update(vscode.workspace.getConfiguration("advpl").get("projectActive"));

    context.subscriptions.push(removeLastWorkspace());
    context.subscriptions.push(switchProject());

    // vscode.commands.executeCommand('switch.removeLastWorkspace').then((e => {
    //     // context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => e.affectsConfiguration(trocaManual()));
    // }));
}

function switchProject() {
    let disposable = vscode.commands.registerCommand('switch.switchProject', () => {

        window.showQuickPick(getPatches()).then((a => {
            if (a) {
                let _uri = vscode.Uri.parse("file:" + a.value);
                changeProject(_uri, a.label);
            } else {
                window.showErrorMessage("Erro ao alterar o projeto.");
            }
        }));

    });
    return disposable;
}

function removeLastWorkspace() {
    let disposable = vscode.commands.registerCommand('switch.removeLastWorkspace', () => {

        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {

            if (vscode.workspace.updateWorkspaceFolders(1, vscode.workspace.workspaceFolders.length - 1)) {
                vscode.workspace.saveAll();
                console.log((vscode.workspace.workspaceFolders.length - 1).toString() + " projetos removidos.");
            } else {
                console.log("Erro ao remover os projetos.");
            }
        }
    });

    return disposable;
}

// this method is called when your extension is deactivated
export function deactivate() {
}

// function showFolders() {

//     window.showQuickPick(patches).then((a => {
//         let _uri: Uri;

//         if (a) {
//             if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
//                 for (let i = 1; i < vscode.workspace.workspaceFolders.length; i++) {
//                     const element = vscode.workspace.workspaceFolders[i];
//                     removeWorkspace(element.uri);
//                 }
//             }

//             vscode.workspace.saveAll().then((b => {

//                 _uri = vscode.Uri.parse("file:" + a.value);

//                 if (openWorkspace(_uri, a.label)) {
//                     window.showInformationMessage("Projeto trocado para: " + a.label);
//                 }

//                 //     if (vscode.workspace.updateWorkspaceFolders(0, null, { uri: _uri, name: a.label })) {
//                 //         vscode.workspace.saveAll().then((c => {
//                 //             if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
//                 //                 vscode.workspace.updateWorkspaceFolders(1, vscode.workspace.workspaceFolders.length - 1);
//                 //             }
//                 //         })).then((d => {
//                 //             vscode.workspace.saveAll().then((e => {
//                 //                 let updObj = vscode.workspace.getConfiguration("advpl");
//                 //                 updObj.update("projectActive", a.label);
//                 //                 status.update(a.label);
//                 //                 window.showInformationMessage("Projeto trocado para: " + a.label);
//                 //             }));
//                 //         }));
//                 //     }
//             }));
//         }
//     }));
// }

export function openWorkspace(uri: vscode.Uri, name: string) {
    return vscode.workspace.updateWorkspaceFolders(0, 1, { uri, name });
}

export function addWorkspace(uri: vscode.Uri, name: string) {
    return vscode.workspace.updateWorkspaceFolders(0, 0, { uri, name });
}

export function removeWorkspace(uri: vscode.Uri) {
    const { getWorkspaceFolder } = vscode.workspace;
    const workspaceFolder = getWorkspaceFolder(uri);
    // const index = workspaceFolders.findIndex(wf => {
    //   const wfUri = wf.uri;

    //   return (
    //     wfUri.scheme === uri.scheme && wfUri.authority === uri.authority && wfUri.path === uri.path
    //   );
    // });

    if (!workspaceFolder) {
        return;
    }

    return vscode.workspace.updateWorkspaceFolders(workspaceFolder.index, 1);
}

export function getPatches() {
    let patches: Array<List> = [];
    let folders = vscode.workspace.getConfiguration("advpl").get<Array<Folder>>("foldersProject");

    if (folders) {
        for (let i = 0; i < folders.length; i++) {
            patches.push(
                new List(folders[i].name, "", folders[i].path)
            );
        }
    }

    return patches;
}

export function changeProject(uri: vscode.Uri, label: string) {
    if (openWorkspace(uri, label)) {
        let updObj = vscode.workspace.getConfiguration("advpl");
        updObj.update("projectActive", label);
        status.update(label);

        window.showInformationMessage("Projeto trocado para: " + label);
    } else {
        window.showErrorMessage("Não foi possível alterar para o projeto: " + label);
    }
}

export function trocaManual() {
    let projectActive = vscode.workspace.getConfiguration("advpl").get<string>('projectActive');

    if (projectActive) {
        let _uri = vscode.Uri.parse("file:" + getPathByLabel(projectActive));

        changeProject(_uri, projectActive);
    }
}
export function getPathByLabel(label: string) {
    let patches = getPatches();

    // if (projectActive) {
    return patches[patches.findIndex(e => e.label === label)].value;
    // }

    // return undefined;
}