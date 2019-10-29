import { ExtensionContext, workspace, Uri, window } from "vscode";
import * as fs from "fs";

export default class Storage {
  public cxt: ExtensionContext;
  public savePath: Uri;

  constructor(cxt: ExtensionContext) {
    this.cxt = cxt;
    this.savePath = Uri.parse(`file://${this.cxt.storagePath}/swaggerMetaJSON`);
  }
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
  write(str: string, fileName: string) {
    const path = Uri.parse(`file://${this.cxt.storagePath}/${fileName}`);
    return workspace.fs.writeFile(path, Buffer.from(str));
  }
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
  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }

    return true;
  }
}
