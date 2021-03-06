import { window, StatusBarItem, StatusBarAlignment } from 'vscode';

export class StatusProject {
    private _statusBarItem : StatusBarItem;
    private _selectedProject: string = "Selecionar Projeto";

    constructor(){
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);
        this._statusBarItem.command = "switch.switchProject";
        this._statusBarItem.text = this._selectedProject;
    }

    public update(selectedProject?: string) {
        if (selectedProject && selectedProject.trim() !== '') {
            this._selectedProject = selectedProject;
        } else {
            this._selectedProject = "Selecionar Projeto";
        }

        this._statusBarItem.text = "$(file-directory) " + this._selectedProject;
        this._statusBarItem.show();
    }
}