import * as vscode from "vscode";
import ConverToApi from "../sourceProvider/sourceDataProcessor";
import Storage from "./storage";
import CommonQuery from "../viewManage/selector/commonQuery";
import { Fetch } from "./fetch";

export default class SourceDataFetch {
  /**
   * 读取当前打开文件
   * @param context vscode.ExtensionContext
   */
  static async fromActiveFile(context: vscode.ExtensionContext) {
    if (vscode.window.activeTextEditor) {
      const saveFile: Storage = new Storage(context);
      const convertTool = new ConverToApi();
      const filePath = vscode.window.activeTextEditor.document.uri;

      const fullApi = await convertTool.convertPath(filePath);
      const saveBuffer = saveFile.jsonToBuffer(fullApi);
      return saveFile.writeFile(saveBuffer as Buffer);
    }
    throw new Error("No Active File");
  }
  /**
   * 选择本地文件
   * @param context vscode.ExtensionContext
   */
  static async fromSelectFile() {
    const url = await CommonQuery.inputLocalDatasource();
    console.log(url);
  }
  /**
   * 读取远程文件
   * @param context vscode.ExtensionContext
   */
  static async fromRemoteFile(context: vscode.ExtensionContext) {
    try {
      const fetch = new Fetch(context);
      const url = await CommonQuery.inputRemoteDatasource();
      if (!url) {
        return;
      }
      const saveFile: Storage = new Storage(context);
      const convertTool = new ConverToApi();
      const filePath = await fetch.fetchYaml(saveFile, url);
      const fullApi = await convertTool.convertPath(filePath);
      const saveBuffer = saveFile.jsonToBuffer(fullApi);
      return saveFile.writeFile(saveBuffer as Buffer);
    } catch (error) {
      Promise.reject(error);
    }
  }
}
