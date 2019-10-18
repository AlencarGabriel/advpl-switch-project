'use strict';

import * as vscode from 'vscode';
import { window } from 'vscode';
import { List } from './objects/List';
import { StatusProject } from './objects/StatusProject';
import { Project } from './objects/Project';
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

    // Ao iniciar a extensão atualiza as configurações para o ambiente que está realmente configurado
    // Obs.: Em alguns casos a extensão é reiniciada, ou por algum erro o projeto não é trocado.
    if (vscode.workspace.workspaceFolders) {
        if (vscode.workspace.workspaceFolders.length > 0) {

            // Busca o projeto ativo
            let prjActive = vscode.workspace.workspaceFolders[0].name;

            // Atualiza a configuração setando o projeto ativo
            vscode.workspace.getConfiguration("advpl").update("projectActive", prjActive).then(e => {

                // Atualiza o status bar
                status.update(prjActive);

                // Atualiza os ambientes que ficarão habilitados
                if (vscode.workspace.workspaceFolders) {
                    // Se há mais de um projeto habilitado, carrega todos os ambientes
                    if (vscode.workspace.workspaceFolders.length > 1) {
                        disableEnvironments("", true);
                    } else {
                        // senão apenas os do projeto aberto
                        disableEnvironments(prjActive);
                    }
                }
            });
        }
    }

    context.subscriptions.push(addRemoveLastWorkspace());
    context.subscriptions.push(addSwitchProject());
    context.subscriptions.push(addDisableEnvironments());
    context.subscriptions.push(addEnableEnvironments());
    context.subscriptions.push(addEnableProjects());
    context.subscriptions.push(addSetDefault());
    context.subscriptions.push(addAddProject());
    context.subscriptions.push(addDelProject());
}

function addSwitchProject() {
    let disposable = vscode.commands.registerCommand('switch.switchProject', () => {

        if (checkWorkspaceFolders()) {
            window.showQuickPick(getPatches(false)).then((a => {
                if (a) {
                    let _uri = vscode.Uri.parse("file:" + a.value);
                    changeProject(new Project(_uri, a.label));
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

        if (vscode.workspace.workspaceFolders) {
            if (vscode.workspace.workspaceFolders.length > 1) {

                disableEnvironments(vscode.workspace.workspaceFolders[0].name).then(e => {

                    if (vscode.workspace.workspaceFolders) {
                        if (vscode.workspace.updateWorkspaceFolders(1, vscode.workspace.workspaceFolders.length - 1)) {

                            vscode.workspace.saveAll().then(e => {

                                console.log("Projetos removidos.");
                                // Atualiza a janela para recarregar a extensão
                                vscode.commands.executeCommand("workbench.action.reloadWindow");

                            });
                        }
                    }
                });

            } else {
                console.log("Erro ao remover os projetos.");
            }
        }
    });

    return disposable;
}

function addDisableEnvironments() {
    let disposable = vscode.commands.registerCommand('switch.disableEnvironments', () => {

        let projectActive = vscode.workspace.getConfiguration("advpl").get<string>("projectActive");

        // Checa se o usuário desativou a opção para mostrar somente os ambientes vinculados ao projeto
        if (onlyRelatedEnvironments()) {

            // Caso tenha configurado o projeto ativo, deixa habilitado os ambientes relacionados
            if (projectActive) {
                disableEnvironments(projectActive).then(e => {
                    window.showInformationMessage("Ambientes Desabilitados.");
                });
            } else {
                // Se não desabilita todos os ambientes
                disableEnvironments("").then(e => {
                    window.showInformationMessage("Todos Ambientes Desabilitados.");
                });
            }

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

            disableEnvironments("", true).then(e => {
                window.showInformationMessage("Todos os ambientes foram Habilitados.");
            });

        } else {
            window.showInformationMessage("Este comando só terá efeito se a configuração 'advpl.onlyRelatedEnvironments' estiver habilitada.");
        }

    });

    return disposable;
}

function addEnableProjects() {
    let disposable = vscode.commands.registerCommand('switch.enableProjects', () => {

        // Checa se o usuário desativou a opção para mostrar somente os ambientes vinculados ao projeto
        if (onlyRelatedEnvironments()) {

            openAllProjects().then(e => {

                // window.showInformationMessage("Todos os Projetos foram Habilitados.");

                // Atualiza a janela para recarregar a extensão
                vscode.commands.executeCommand("workbench.action.reloadWindow");
            });

        } else {
            window.showInformationMessage("Este comando só terá efeito se a configuração 'advpl.onlyRelatedEnvironments' estiver habilitada.");
        }

    });

    return disposable;
}

function addSetDefault() {
    let disposable = vscode.commands.registerCommand('switch.setDefault', (element) => {

        let config = vscode.workspace.getConfiguration("advpl");
        let projectActive = config.get<string>("projectActive");
        let folders = config.get<Array<IFolder>>("foldersProject");

        // Verifica se existe a configurção de projetos
        if (folders) {
            if (folders.length === 0) {
                window.showWarningMessage("Não há projetos definidos na configuração advpl.foldersProject", ...["Configurações"]).then((e) => {
                    if (e === "Configurações") {
                        vscode.commands.executeCommand("workbench.action.openSettings");
                    }
                });
            }

            folders.map(_folder => {
                // Altera o ambiente Default do projeto que está conectado
                if (_folder.name.trim() === projectActive) {
                    _folder.environment_default = element.label;
                }
            });

            // Altera as configurações dos projetos
            config.update("foldersProject", folders).then(e => {
                vscode.window.showInformationMessage("Ambiente " + element.label + " definido como Padrão.");
            });

        } else {
            window.showWarningMessage("Não há projetos definidos na configuração advpl.foldersProject", ...["Configurações"]).then((e) => {
                if (e === "Configurações") {
                    vscode.commands.executeCommand("workbench.action.openSettings");
                }
            });
        }


    });

    return disposable;
}

function addAddProject() {
    let disposable = vscode.commands.registerCommand('switch.addProject', (element) => {

        let config = vscode.workspace.getConfiguration("advpl");
        let projectActive = config.get<string>("projectActive");
        let folders = config.get<Array<IFolder>>("foldersProject");
        let adicionou = false;

        // Verifica se existe a configurção de projetos
        if (folders) {
            if (folders.length === 0) {
                window.showWarningMessage("Não há projetos definidos na configuração advpl.foldersProject", ...["Configurações"]).then((e) => {
                    if (e === "Configurações") {
                        vscode.commands.executeCommand("workbench.action.openSettings");
                    }
                });
            }

            folders.map(_folder => {
                // Adiciona o ambiente desejado ao projeto que está conectado
                if (_folder.name.trim() === projectActive) {
                    if (_folder.environments) {
                        // Verifica se o ambiente em questão já está associado ao projeto
                        if (!_folder.environments.find(env => env.toUpperCase() === element.label.toUpperCase())) {
                            _folder.environments.push(element.label);
                            adicionou = true;
                        }
                    } else {
                        _folder.environments = new Array<string>(element.label);
                        adicionou = true;
                    }
                }
            });

            // Altera as configurações dos projetos
            if (adicionou) {
                config.update("foldersProject", folders).then(e => {
                    let projectActive = vscode.workspace.getConfiguration("advpl").get<string>("projectActive");

                    // Checa se o usuário desativou a opção para mostrar somente os ambientes vinculados ao projeto
                    if (onlyRelatedEnvironments()) {
                        vscode.window.showInformationMessage("Ambiente " + element.label + " associado ao projeto " + projectActive + ".", ...["Recarregar Projeto"]).then(e => {
                            // Recarrega o projeto, mostrando apenas os ambientes relacionados a ele
                            if (projectActive) {
                                disableEnvironments(projectActive);
                            }
                        });
                    } else {
                        vscode.window.showInformationMessage("Ambiente " + element.label + " associado ao projeto " + projectActive + ".");
                    }
                });
            } else {
                vscode.window.showWarningMessage("Ambiente " + element.label + " já está associado ao projeto " + projectActive + ".");
            }

        } else {
            window.showWarningMessage("Não há projetos definidos na configuração advpl.foldersProject", ...["Configurações"]).then((e) => {
                if (e === "Configurações") {
                    vscode.commands.executeCommand("workbench.action.openSettings");
                }
            });
        }


    });

    return disposable;
}

function addDelProject() {
    let disposable = vscode.commands.registerCommand('switch.delProject', (element) => {

        let config = vscode.workspace.getConfiguration("advpl");
        let projectActive = config.get<string>("projectActive");
        let folders = config.get<Array<IFolder>>("foldersProject");
        let removeu = false;

        // Verifica se existe a configurção de projetos
        if (folders) {
            if (folders.length === 0) {
                window.showWarningMessage("Não há projetos definidos na configuração advpl.foldersProject", ...["Configurações"]).then((e) => {
                    if (e === "Configurações") {
                        vscode.commands.executeCommand("workbench.action.openSettings");
                    }
                });
            }

            folders.map(_folder => {
                // Adiciona o ambiente desejado ao projeto que está conectado
                if (_folder.name.trim() === projectActive) {
                    if (_folder.environments) {
                        // Verifica se o ambiente em questão já está associado ao projeto
                        if (_folder.environments.find(env => env.toUpperCase() === element.label.toUpperCase())) {
                            // Remove o ambiente da relação de ambientes do projeto
                            _folder.environments.splice(
                                _folder.environments.findIndex(env => env.toUpperCase() === element.label.toUpperCase()),
                                1);
                            removeu = true;
                        }
                    }
                }
            });

            // Altera as configurações dos projetos
            if (removeu) {
                config.update("foldersProject", folders).then(e => {
                    let projectActive = vscode.workspace.getConfiguration("advpl").get<string>("projectActive");

                    // Checa se o usuário desativou a opção para mostrar somente os ambientes vinculados ao projeto
                    if (onlyRelatedEnvironments()) {

                        // Caso tenha configurado o projeto ativo, deixa habilitado os ambientes relacionados
                        if (projectActive) {
                            // Recarrega o projeto, mostrando apenas os ambientes relacionados a ele
                            disableEnvironments(projectActive).then(e => {
                                vscode.window.showInformationMessage("Ambiente " + element.label + " removido do projeto " + projectActive + ".");
                            });
                        }
                    } else {
                        vscode.window.showInformationMessage("Ambiente " + element.label + " removido do projeto " + projectActive + ".");
                    }
                });
            } else {
                vscode.window.showWarningMessage("Ambiente " + element.label + " não está associado ao projeto " + projectActive + ".");
            }

        } else {
            window.showWarningMessage("Não há projetos definidos na configuração advpl.foldersProject", ...["Configurações"]).then((e) => {
                if (e === "Configurações") {
                    vscode.commands.executeCommand("workbench.action.openSettings");
                }
            });
        }


    });

    return disposable;
}

// this method is called when your extension is deactivated
export function deactivate() {
}

export function openAllProjects(): Thenable<void> {
    let projects = Array<Project>();

    return new Promise(function (resolve) {
        getPatches().forEach(element => {
            projects.push(new Project(vscode.Uri.parse("file:" + element.value), element.label));
        });

        // Atualiza os ambientes que ficarão habilitados
        disableEnvironments("", true).then(e => {
            if (vscode.workspace.workspaceFolders) {
                vscode.workspace.updateWorkspaceFolders(0, vscode.workspace.workspaceFolders.length, ...projects);
            }

            resolve();
        });

    });
}

vscode.workspace.onDidChangeWorkspaceFolders(e => {
    console.log("Changed Folders");
});

vscode.workspace.onDidChangeConfiguration(e => {
    console.log("Changed Configuration");
});

export function openWorkspace(prj: Project) {
    let uri = prj.uri;
    let name = prj.name;

    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.updateWorkspaceFolders(0, 1, { uri, name });
    } else {
        return addWorkspace(prj);
    }
}

export function addWorkspace(prj: Project) {
    let uri = prj.uri;
    let name = prj.name;

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

export function getPatches(fetchAll: boolean = true) {
    let patches: Array<List> = [];
    let config = vscode.workspace.getConfiguration("advpl");
    let folders = config.get<Array<IFolder>>("foldersProject");
    let projectActive = config.get<string>("projectActive");

    // Verifica se existe a configurção de projetos e de projeto ativo
    if (folders && projectActive) {
        if (folders.length === 0) {
            window.showWarningMessage("Não há projetos definidos na configuração advpl.foldersProject", ...["Configurações"]).then((e) => {
                if (e === "Configurações") {
                    vscode.commands.executeCommand("workbench.action.openSettings");
                }
            });
        }

        for (let i = 0; i < folders.length; i++) {
            // Não retorna o projeto que já está conectado caso a chamada seja pelo QuickPick
            if ((projectActive.trim() !== folders[i].name.trim() && !fetchAll) || fetchAll) {
                patches.push(
                    new List(
                        folders[i].name,
                        folders[i].path,
                        folders[i].path,
                        folders[i].environment_default
                    )
                );
            }
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

export function changeProject(prj: Project) {
    let updObj = vscode.workspace.getConfiguration("advpl");
    let projectActive = updObj.get<string>("projectActive");

    // Não deixa trocar para o mesmo projeto já aberto. Por algum motivo isso dá erro no VSCode quando se tenta trocar depois.
    if (prj.name === projectActive) {
        window.showInformationMessage("Este projeto já está aberto");
        return;
    } else {
        // Atualiza a configuração setando o projeto ativo
        updObj.update("projectActive", prj.name).then(e => {

            // Atualiza os ambientes que ficarão habilitados
            disableEnvironments(prj.name).then(e => {

                // Não precisa atualizar a Status Bar agora pois neste caso a extensão será reiniciada

                if (!openWorkspace(prj)) {
                    window.showErrorMessage("Não foi possível alterar para o projeto: " + prj.name, ...["Reload"]).then(() => {
                        // Atualiza a janela para recarregar a extensão
                        vscode.commands.executeCommand("workbench.action.reloadWindow");
                    });
                }
            });

        });
    }
}

export function getPathByLabel(label: string) {
    let patches = getPatches();

    return patches[patches.findIndex(e => e.label === label)].value;
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

function disableEnvironments(projectName: string, forceEnabled: boolean = false): Thenable<void> {
    // Busca as configurações
    const config = vscode.workspace.getConfiguration("advpl");

    // Busca os ambientes configurados
    let environments = config.get<Array<IEnvironment>>("environments");

    // Checa se o usuário desativou a opção para mostrar somente os ambientes vinculados ao projeto
    if (onlyRelatedEnvironments()) {

        // Busca os projetos configurados
        const projects = config.get<Array<IFolder>>("foldersProject");

        // Busca o ambiente relacionado do projeto
        if (projects) {
            const project = projects.find(prj => prj.name === projectName && !isNullOrEmpty(prj.name));

            if (project) {
                // Guarda os ambientes que foram relacionados com o projeto
                let environmentProjects = project.environments;

                // Se a configuração de ambientes relacionados ao projeto estiver setada e pelo menos 1 ambiente definido
                if (environmentProjects) {
                    if (environmentProjects.length > 0) {

                        // Se foi encontrado ambientes e os projetos vinculados não estão vazios, trata os ambientes do projeto
                        if (environments) {
                            environments.forEach(element => {

                                // Faz o tratamento para os ambientes que tem o nome definido ou não.
                                let environment: string;
                                // tslint:disable-next-line:curly
                                if (element.name) environment = element.name; else environment = element.environment;

                                // Se o ambiente atual for encontrado na lista de ambientes vinculados, habilita nas configurações, se não desabilita
                                // tslint:disable-next-line:curly
                                if (environmentProjects.findIndex(env => environment.trim() === env.trim()) > -1) element.enable = true; else element.enable = false;
                            });
                        }
                    } else {
                        // Habilita todos os ambientes caso o projeto não tenha ambientes informados
                        disableEnvironments("", true);
                    }
                } else {
                    // Habilita todos os ambientes caso o projeto não tenha ambientes informados
                    disableEnvironments("", true);
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

                }
            }
        }
    }

    return new Promise(function (resolve) {
        config.update("environments", environments).then(e => {
            changeEnvironment(environments, config).then(e => {
                resolve();
            });
        });
    });
}

export function changeEnvironment(environments: Array<IEnvironment> | undefined, config: vscode.WorkspaceConfiguration): Thenable<void> {

    return new Promise(function (resolve) {

        // Após atualizar os ambientes, mantem ativo o primeiro que não está desabilitado
        if (environments) {
            let envEnabled = environments.filter(env => env.enable !== false);

            if (envEnabled.length > 0) {
                config.update("selectedEnvironment", envEnabled[0].name ? envEnabled[0].name : envEnabled[0].environment).then(e => {
                    resolve();
                });
            } else {
                config.update("selectedEnvironment", "Selecione o Ambiente").then(e => {
                    resolve();
                });
            }
        } else {
            resolve();
        }
    });

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