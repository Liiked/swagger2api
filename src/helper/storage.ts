import { ExtensionContext, workspace, Uri, window } from "vscode";
import * as fs from "fs";

export default class Storage {
  public cxt: ExtensionContext;
  public savePath: Uri;

  constructor(cxt: ExtensionContext) {
    this.cxt = cxt;
    this.savePath = Uri.parse(`file://${this.cxt.storagePath}/swaggerMetaJSON`);
  }
  /**
   * json 转 buffer
   */
  jsonToBuffer(json: object): Buffer | undefined {
    try {
      const str = JSON.stringify(json);
      return Buffer.from(str);
    } catch (error) {
      console.error(error);
    }
  }
  writeFile(content: Buffer) {
    return workspace.fs.writeFile(this.savePath, content);
  }
  /**
   * 储存swagger源数据
   */
  readFile() {
    if (this.pathExists(`${this.cxt.storagePath}/swaggerMetaJSON`)) {
      return workspace.fs.readFile(this.savePath);
    }
    window.showInformationMessage(
      "Workspace doesn't include any swagger data. You can try convert a Swagger file first."
    );
    return Promise.reject({
      error: "File not generated!"
    });
  }
  /**
   * 通用工作区存储目录-写入方法
   * @param content 文件内容
   * @param fileName 文件名
   */
  write(content: string, fileName: string) {
    const path = Uri.parse(`file://${this.cxt.storagePath}/${fileName}`);
    return workspace.fs.writeFile(path, Buffer.from(content));
  }
  /**
   * 通用工作区存储目录-读取方法
   * @param fileName 文件名
   */
  read(fileName: string) {
    if (this.pathExists(`${this.cxt.storagePath}/${fileName}`)) {
      const savePath = Uri.parse(`file://${this.cxt.storagePath}/${fileName}`);
      return workspace.fs.readFile(savePath);
    }
    window.showInformationMessage(
      "Workspace doesn't include any swagger data. You can try convert a Swagger file first."
    );
    return Promise.reject({
      error: "File not generated!"
    });
  }
  /**
   * 清理缓存
   */
  clearFile() {
    this.writeFile(Buffer.from(""));
  }
  pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
}
