'use strict';

export default interface IFolder {
    path: string;
    name: string;
    environments: string[];
    environment_default: string;
    paths: string[];
}