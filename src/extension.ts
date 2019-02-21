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
    status.update(vscode.workspace.getConfiguration("advpl").get("projectActive"));

    context.subscriptions.push(addRemoveLastWorkspace());
    context.subscriptions.push(addSwitchProject());
    context.subscriptions.push(addDisableEnvironments());
    context.subscriptions.push(addEnableEnvironments());
    context.subscriptions.push(addEnableProjects());

    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(
        { language: "advpl" }, new FooDocumentSymbolProvider()
    ));
}

interface IAdvplSymbol {
    /**
     * Nome do Symbolo - Será exibido na outline
     */
    name: string;

    /**
     * Detalhe do símbolo - Informação complementar que será exibida na outline
     */
    detail: string;

    /**
     * Identificação do nível do símbolo
     */
    level: Number;

    /**
	 * O tipo desse símbolo.
	 */
    kind: vscode.SymbolKind;

    /**
	 * O intervalo que inclui esse símbolo não inclui espaço em branco inicial / final, mas todo o restante, por exemplo, comentários e código.
	 */
    range: vscode.Range;

    /**
     * O intervalo que deve ser selecionado e revela quando este símbolo está sendo escolhido, por exemplo, o nome de uma função.
     */
    selectionRange: vscode.Range;

}

enum LevelType {
    UserFunction = 0,
    StaticFunction = 0,
    LocalVariables = 1,
    PrivateVariables = 1
}

class AdvplSymbol implements IAdvplSymbol {
    name: string;
    detail: string;
    level: LevelType;
    kind: vscode.SymbolKind;
    range: vscode.Range;
    selectionRange: vscode.Range;

    constructor(name: string, detail: string, level: LevelType, kind: vscode.SymbolKind, range: vscode.Range, selectionRange: vscode.Range) {
        this.name = name;
        this.detail = detail;
        this.level = level;
        this.kind = kind;
        this.range = range;
        this.selectionRange = selectionRange;
    }

    public getDocumentSymbol(): vscode.DocumentSymbol {
        return new vscode.DocumentSymbol(
            this.name,
            this.detail,
            this.kind,
            this.range,
            this.range,
        )
    }

}

class FooDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    private compareSymbolWithLine(line: vscode.TextLine, symbol: string[]): Boolean {
        let ret = true;

        symbol.every(function (_value, _index, _arr) {
            ret = line.text.toUpperCase().includes(_value.toUpperCase());
            return ret;
        });

        return ret;
    }

    public provideDocumentSymbols(document: vscode.TextDocument,
        token: vscode.CancellationToken): Thenable<vscode.DocumentSymbol[]> {

        return new Promise((resolve, reject) => {

            let symbols: vscode.DocumentSymbol[] = [];
            let advplSymbols = [];

            // Percorre o arquivo para encontrar os simbolos Advpl
            for (let i = 0; i < document.lineCount; i++) {
                let line = document.lineAt(i);

                if (this.compareSymbolWithLine(line, ["User", "Function"])) {
                    advplSymbols.push(
                        new AdvplSymbol(
                            line.text,
                            "User Function AdvPL",
                            LevelType.UserFunction,
                            vscode.SymbolKind.Function,
                            line.range,
                            line.range
                        )
                    );
                }

                if (this.compareSymbolWithLine(line, ["Static", "Function"])) {
                    advplSymbols.push(
                        new AdvplSymbol(
                            line.text,
                            "Static Function AdvPL",
                            LevelType.StaticFunction,
                            vscode.SymbolKind.Function,
                            line.range,
                            line.range
                        )
                    );
                }

                if (this.compareSymbolWithLine(line, ["Local "])) {
                    advplSymbols.push(
                        new AdvplSymbol(
                            line.text,
                            "Local Variable AdvPL",
                            LevelType.LocalVariables,
                            vscode.SymbolKind.Variable,
                            line.range,
                            line.range
                        )
                    );
                }
            }

            // Elemento PAI
            let elementParent: number, elementChild: number;

            advplSymbols.forEach(element => {
                if (element.level === 0) {
                    // Adiciona o simbolo PAI
                    elementParent = symbols.push(
                        element.getDocumentSymbol()
                    ) - 1;
                } else if (element.level === 1) {
                    // Adiciona o simbolo Filho
                    elementChild = symbols[elementParent].children.push(
                        element.getDocumentSymbol()
                    ) - 1;
                } else if (element.level === 2) {
                    symbols[elementChild].children.push(
                        element.getDocumentSymbol()
                    );
                }
            });

            resolve(symbols);
        });

        // https://github.com/fabiospampinato/vscode-todo-plus/blob/master/src/providers/symbols.ts
    }
}

function addSwitchProject() {
    let disposable = vscode.commands.registerCommand('switch.switchProject', () => {

        if (checkWorkspaceFolders()) {
            window.showQuickPick(getPatches()).then((a => {
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

function addEnableProjects() {
    let disposable = vscode.commands.registerCommand('switch.enableProjects', () => {

        // Checa se o usuário desativou a opção para mostrar somente os ambientes vinculados ao projeto
        if (onlyRelatedEnvironments()) {
            openAllProjects();
            window.showInformationMessage("Todos os Projetos foram Habilitados.");
        } else {
            window.showInformationMessage("Este comando só terá efeito se a configuração 'advpl.onlyRelatedEnvironments' estiver habilitada.");
        }

    });

    return disposable;
}

// this method is called when your extension is deactivated
export function deactivate() {
}

export function openAllProjects() {
    let projects = Array<Project>();

    getPatches().forEach(element => {
        projects.push(new Project(vscode.Uri.parse("file:" + element.value), element.label));
    });

    if (vscode.workspace.workspaceFolders) {
        return vscode.workspace.updateWorkspaceFolders(0, vscode.workspace.workspaceFolders.length, ...projects);
    }
}

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

export function changeProject(prj: Project) {
    let updObj = vscode.workspace.getConfiguration("advpl");

    // Não deixa trocar para o mesmo projeto já aberto. Por algum motivo isso dá erro no VSCode quando se tenta trocar depois.
    if (prj.name === updObj.get<string>("projectActive")) {
        return;
    } else {
        if (openWorkspace(prj)) {

            // Atualiza a configuração setando o projeto ativo
            updObj.update("projectActive", prj.name); //.then(() => { // Usando o Promise está causando erro dentro do Then() inesplicável.

            // Atualiza a Status Bar
            status.update(prj.name);

            // Atualiza os ambientes que ficarão habilitados
            disableEnvironments(prj.name);

            window.showInformationMessage("Projeto trocado para: " + prj.name);
            // Não é mais necessário pois ao invocar o debug do projeto, a variavel é atualizada automaticamente.
            // Chama o comando que atualiza a configuração 'workspaceFolders' utilizada pela extensão killerall.advpl-vscode
            // vscode.commands.executeCommand("advpl.getDebugInfos");
            // });

        } else {
            window.showErrorMessage("Não foi possível alterar para o projeto: " + prj.name, ...["Reload"]).then(() => {
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
                // Guarda os ambientes que foram relacionados com o projeto
                let environmentProjects = project.environments;

                // Se foi encontrado ambientes e os projetos vinculados não estão vazios, trata os ambientes do projeto
                if (environments && (environmentProjects.length > 0)) {
                    environments.forEach(element => {

                        // Faz o tratamento para os ambientes que tem o nome definido ou não.
                        let environment: string;
                        // tslint:disable-next-line:curly
                        if (element.name) environment = element.name; else environment = element.environment;

                        // Se o ambiente atual for encontrado na lista de ambientes vinculados, habilita nas configurações, se não desabilita
                        // tslint:disable-next-line:curly
                        if (environmentProjects.findIndex(env => environment.trim() === env.trim()) > -1) element.enable = true; else element.enable = false;
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