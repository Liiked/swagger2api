import {
  paramFactory,
  returnFactory,
  payloadFactory,
  schema,
  handledcommonPayloadValue
} from "./parsers/swaggerAnalyser";
import path from "path";
import { API, Parser } from "./types";
import * as vscode from "vscode";
const fs = require("fs");
import SwaggerParser from "swagger-parser";

export default class ConverToApi {
  exportPath = ""; // 导出路径
  /**
   * 源数据转为通用数据
   * @param uri 数据源存储路径
   */
  async convertPath(uri: vscode.Uri): Promise<API.List> {
    let apiDocument = null;
    apiDocument = await SwaggerParser.validate(
      decodeURIComponent(uri.toString())
    ).catch(e => {
      // TODO: 错误需暴露到上层统一处理
      vscode.window.showErrorMessage("Validate Error:", e.message);
      Promise.reject(e);
    });

    if (!apiDocument) {
      return {};
    }
    const { paths } = apiDocument;
    const moduleObj: API.List = {};

    /* 提取tag */
    const moduleSet = new Set(this.extractTags(paths) as []);
    const wholeTags = Array.from(moduleSet);
    wholeTags.forEach((e: string) => {
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
          responses,
          parameters,
          operationId,
          requestBody
        } = request;

        const params: Parser.ParamType[] = paramFactory(parameters);
        const payload: schema = payloadFactory(requestBody);
        const returnObj: schema = returnFactory(responses);

        tags.forEach((e: string) => {
          moduleObj[e] = [
            ...moduleObj[e],
            {
              url,
              method,
              response: returnObj,
              operationId,
              title: summary || url.replace(/\//g, "_"),
              params,
              payload
            }
          ];
        });
      }
    }
    return moduleObj;
  }

  /**
   * 辅助函数-提取swagger标签
   * @param paths swagger中的path对象
   */
  private extractTags(paths: object) {
    return Object.values(paths).reduce((total: any[], path): any[] => {
      const _module = Object.values(path as object).map(d => d.tags[0]);
      return [...(total as []), ..._module];
    }, []);
  }
  /**
   * 生成文件的导出路径/目录
   * @param uri 插件存储路径
   */
  private genPath(uri: vscode.Uri): string {
    const p = uri.path;
    const swaggerPath = "/exportApi";
    return p + swaggerPath;
  }

  /**
   * 辅助函数-检查路径是否已经存在
   * @param uri 插件存储路径
   */
  checkDirExisted(uri: vscode.Uri): Boolean {
    this.exportPath = this.genPath(uri);
    return fs.existsSync(this.exportPath);
  }
  /**
   * 清空目录
   * @param uri
   */
  cleanDir(uri: vscode.Uri) {
    if (this.checkDirExisted(uri)) {
      deleteFolder(this.exportPath);
    }
  }
  /**
   * 生成目录
   * @param uri
   */
  genDir(uri: vscode.Uri) {
    this.exportPath = this.genPath(uri);
    fs.mkdirSync(this.exportPath);
  }
  /**
   * 生成文件
   * @param fileName 文件名
   * @param content 文件内容
   */
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
