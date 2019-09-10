import {
  paramFactory,
  returnFactory,
  payloadFactory,
  parseModule
} from "./parser";
import * as vscode from "vscode";
const fs = require("fs");
const path = require("path");
// const { moduleParser } = require("../template.js");

interface KeyValue {
  [propName: string]: any[];
}

export default class ConverToApi {
  exportPath = "";
  convert(content: string) {
    const obj = JSON.parse(content);
    const { openapi: isSwaggerJson, paths } = obj;

    if (!isSwaggerJson) {
      throw new Error(
        "Unexportable file, please use swagger json file to export."
      );
    }

    if (!Object.keys(paths).length) {
      throw new Error("No api path found, please add some path for export.");
    }

    const moduleObj: KeyValue = {};

    let modules = Object.values(paths).reduce((total: any[], path): any[] => {
      const _module = Object.values(path as object).map(d => d.tags[0]);
      return [...(total as []), ..._module];
    }, []);

    const moduleSet = new Set(modules as []);
    modules = Array.from(moduleSet);
    modules.forEach((e: string) => {
      moduleObj[e] = [];
    });

    for (const url in paths) {
      const path = paths[url];
      for (const method in path) {
        const request = path[method];
        //   请求模型
        const {
          tags,
          summary,
          operationId,
          parameters,
          requestBody,
          responses
        } = request;

        const _module = tags[0];
        const params = paramFactory(parameters);
        const palyload = payloadFactory(requestBody, obj);
        const returnObj = returnFactory(responses, obj);
        moduleObj[_module] = [
          ...moduleObj[_module],
          {
            method,
            operationId,
            paramObj: params,
            payloadObj: palyload,
            url,
            title: summary,
            returnObj
          }
        ];
      }
    }
    return moduleObj;
  }

  private genPath(uri: vscode.Uri): string {
    const p = uri.path;
    const swaggerPath = "/exportApi";
    return p + swaggerPath;
  }
  checkDirExisted(uri: vscode.Uri): Boolean {
    this.exportPath = this.genPath(uri);
    return fs.existsSync(this.exportPath);
  }
  cleanDir(uri: vscode.Uri) {
    if (this.checkDirExisted(uri)) {
      deleteFolder(this.exportPath);
    }
  }
  genDir(uri: vscode.Uri) {
    this.exportPath = this.genPath(uri);
    fs.mkdirSync(this.exportPath);
  }
  genFile(fileName: string, content: string) {
    if (!this.exportPath) {
      throw new Error("No Export Path");
    }
    fs.writeFileSync(this.exportPath + fileName, content, {
      flag: "as+"
    });
  }
}

function deleteFolder(path: string) {
  var files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach((file: string) => {
      var curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        deleteFolder(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
