'use strict';

import * as vscode from 'vscode';
import { window } from 'vscode';
import { List } from './objects/List';
import { StatusProject } from './objects/StatusProject';
import IEnvironment from './interfaces/IEnvironment';
import IFolder from './interfaces/IFolder';

let status: StatusProject;

export function activate(context: vscode.ExtensionContext) {
    let advplVsCode = vscode.extensions.getExtension("KillerAll.advpl-vscode");

    // Verifica antes de tudo se a extensão KillerAll.advpl-vscode está instalada.
    if (advplVsCode) {
        // if (!advplVsCode.isActive) {
        //     window.showWarningMessage("A extensão KillerAll.advpl-vscode está desativada, ative-a antes de usar esta.", ...["Ativar"]).then((e => {
        //         if (e === "Ativar") {
        //             // vscode.commands.executeCommand("workbench.extensions.action.showDisabledExtensions");
        //             if  (advplVsCode){
        //                 advplVsCode.activate();
        //             }
        //         }
        //     }));
        // }else{
        Initialize(context);
        // }
    } else {
        window.showWarningMessage("A extensão KillerAll.advpl-vscode não está instalada, instale-a antes de usar esta.", ...["Instalar"]).then((e => {
            if (e === "Instalar") {
                vscode.commands.executeCommand("workbench.extensions.action.installExtensions");
            }
        }));
    }
}

export function Initialize(context: vscode.ExtensionContext) {
    status = new StatusProject();
    status.update(vscode.workspace.getConfiguration("advpl").get("projectActive"));

    context.subscriptions.push(addRemoveLastWorkspace());
    context.subscriptions.push(addSwitchProject());
    context.subscriptions.push(addDisableEnvironments());
    context.subscriptions.push(addEnableEnvironments());
}

function addSwitchProject() {
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

function addRemoveLastWorkspace() {
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

function addDisableEnvironments() {
    let disposable = vscode.commands.registerCommand('switch.disableEnvironments', () => {

        // Checa se o usuário desativou a opção para mostrar somente os ambientes vinculados ao projeto
        if (onlyRelatedEnvironments()) {
            disableEnvironments("");
            window.showInformationMessage("Todos os ambientes foram Desabilitados.");
        } else {
            window.showInformationMessage("Este comando só terá efeito se a configuração 'advpl.onlyRelatedEnvironments' estiver habilitada.");
        }

    });

    return disposable;
}

function addEnableEnvironments() {
    let disposable = vscode.commands.registerCommand('switch.enableEnvironments', () => {

        // Checa se o usuário desativou a opção para mostrar somente os ambientes vinculados ao projeto
        if (onlyRelatedEnvironments()) {
            disableEnvironments("", true);
            window.showInformationMessage("Todos os ambientes foram Habilitados.");
        } else {
            window.showInformationMessage("Este comando só terá efeito se a configuração 'advpl.onlyRelatedEnvironments' estiver habilitada.");
        }

    });

    return disposable;
}

// this method is called when your extension is deactivated
export function deactivate() {
}

export function openWorkspace(uri: vscode.Uri, name: string) {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.updateWorkspaceFolders(0, 1, { uri, name });
    } else {
        return addWorkspace(uri, name);
    }
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
        if (folders.length === 0) {
            window.showWarningMessage("Não há projetos definidos na configuração advpl.foldersProject", ...["Configurações"]).then((e) => {
                if (e === "Configurações") {
                    vscode.commands.executeCommand("workbench.action.openSettings");
                }
            });
        }

        for (let i = 0; i < folders.length; i++) {
            patches.push(
                new List(folders[i].name, "", folders[i].path)
            );
        }
    } else {
        window.showWarningMessage("Não há projetos definidos na configuração advpl.foldersProject", ...["Configurações"]).then((e) => {
            if (e === "Configurações") {
                vscode.commands.executeCommand("workbench.action.openSettings");
            }
        });
    }

    return patches;
}

export function changeProject(uri: vscode.Uri, label: string) {
    let updObj = vscode.workspace.getConfiguration("advpl");

    // Não deixa trocar para o mesmo projeto já aberto. Por algum motivo isso dá erro no VSCode quando se tenta trocar depois.
    if (label === updObj.get<string>("projectActive")) {
        return;
    } else {
        if (openWorkspace(uri, label)) {

            // Atualiza a configuração setando o projeto ativo
            updObj.update("projectActive", label).then(() => {
                // Atualiza a Status Bar
                status.update(label);

                // Atualiza os ambientes que ficarão habilitados
                disableEnvironments(label);

                window.showInformationMessage("Projeto trocado para: " + label);
                // Não é mais necessário pois ao invocar o debug do projeto, a variavel é atualizada automaticamente.
                // Chama o comando que atualiza a configuração 'workspaceFolders' utilizada pela extensão killerall.advpl-vscode
                // vscode.commands.executeCommand("advpl.getDebugInfos");
            });

        } else {
            window.showErrorMessage("Não foi possível alterar para o projeto: " + label, ...["Reload"]).then(() => {
                // Atualiza a janela para recarregar a extensão
                vscode.commands.executeCommand("workbench.action.reloadWindow");
            });
        }
    }
}

export function getPathByLabel(label: string) {
    let patches = getPatches();

    // if (projectActive) {
    return patches[patches.findIndex(e => e.label === label)].value;
    // }

    // return undefined;
}

export function checkWorkspaceFolders(): Boolean {
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

export function checkConfigOpened(): Boolean {
    let files = vscode.workspace.textDocuments.filter(file => file.fileName === '\\settings\\workspace');
    let fechou = false;

    if (files && files.length > 0) {
        window.showWarningMessage("Necessário fechar o arquivo de configurações antes de alterar o projeto", ...["Fechar Arquivo"]).then((e) => {
            if (e === "Fechar Arquivo") {
                files.forEach(element => {
                    vscode.workspace.openTextDocument(element.uri).then(() => {
                        vscode.commands.executeCommand("workbench.action.closeActiveEditor").then(() => {
                            fechou = true;
                        });
                    });
                });
            }
        });

        return fechou;
    } else {
        return true;
    }
}

function disableEnvironments(projectName: string, forceEnabled: boolean = false) {
    // Busca as configurações
    const config = vscode.workspace.getConfiguration("advpl");

    // Checa se o usuário desativou a opção para mostrar somente os ambientes vinculados ao projeto
    if (onlyRelatedEnvironments()) {

        // Busca os ambientes configurados
        const environments = config.get<Array<IEnvironment>>("environments");

        // Busca os projetos configurados
        const projects = config.get<Array<IFolder>>("foldersProject");

        // Busca o ambiente relacionado do projeto
        if (projects) {
            const project = projects.find(prj => prj.name === projectName && !isNullOrEmpty(prj.name));

            if (project) {
                // Guarda o ambiente que foi relacionado com o projeto
                let environmentProject = project.environment;

                // Se foi encontrado ambientes e o projeto vinculado não está vazio, trata os ambientes do projeto
                if (environments && !isNullOrEmpty(environmentProject)) {
                    environments.forEach(element => {

                        // Faz o tratamento para os ambientes que tem o nome definido ou não.
                        let environment: string;
                        // tslint:disable-next-line:curly
                        if (element.name) environment = element.name; else environment = element.environment;

                        // Se o ambiente atual for igual ao ambiente vinculado, habilita nas configurações, se não desabilita
                        // tslint:disable-next-line:curly
                        if (environment.trim() === environmentProject.trim()) element.enable = true; else element.enable = false;

                    });

                    config.update("environments", environments);

                }
            } else {
                if (environments) {
                    environments.forEach(element => {

                        if (forceEnabled) {
                            // Habilita todos os ambientes
                            element.enable = true;
                        } else {
                            // Desabilita todos os ambientes
                            element.enable = false;
                        }

                    });

                    config.update("environments", environments);
                }
            }
        }
    }
}

export function isNullOrEmpty(value: any): Boolean {
    if (typeof value === "string") {
        return (value === "");
    }

    // tslint:disable-next-line:triple-equals
    if (value == null) {
        return true;
    }

    return true;
}

export function onlyRelatedEnvironments() {
    // Busca as configurações
    const config = vscode.workspace.getConfiguration("advpl");

    // Checa se o usuário desativou a opção para mostrar somente os ambientes vinculados ao projeto
    const onlyRelatedEnvironments = config.get<Boolean>("onlyRelatedEnvironments");

    if (onlyRelatedEnvironments === false) {
        return false;
    } else {
        return true;
    }
}