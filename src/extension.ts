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
}

function switchProject() {
    let disposable = vscode.commands.registerCommand('switch.switchProject', () => {

        if (checkWorkspaceFolders()) {
            window.showQuickPick(getPatches()).then((a => {
                if (a) {
                    let _uri = vscode.Uri.parse("file:" + a.value);
                    changeProject(_uri, a.label);
                } else {
                    window.showErrorMessage("Erro ao alterar o projeto.");
                }
            }));
        }

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

export function openWorkspace(uri: vscode.Uri, name: string) {
    return vscode.workspace.updateWorkspaceFolders(0, 1, { uri, name });
}

export function addWorkspace(uri: vscode.Uri, name: string) {
    return vscode.workspace.updateWorkspaceFolders(0, 0, { uri, name });
}

export function removeWorkspace(uri: vscode.Uri) {
    const { getWorkspaceFolder } = vscode.workspace;
    const workspaceFolder = getWorkspaceFolder(uri);

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

export function checkWorkspaceFolders() {
    let actions: string[] = ["Executar"];

    if (vscode.workspace.workspaceFolders) {
        if (vscode.workspace.workspaceFolders.length > 1) {
            window.showInformationMessage("Necessário rodar o comando: 'Remover últimos projetos' para limpar as outras pastas abertas no workspace.", ...actions).then((e => {
                if (e === "Executar") {
                    vscode.commands.executeCommand("switch.removeLastWorkspace").then(() => {
                        window.showInformationMessage("Comando executado.");
                    });
                }
            }));

            return false;
        }
    }

    return true;
}