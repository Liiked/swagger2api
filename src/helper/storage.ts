import { ExtensionContext, workspace, Uri, window } from "vscode";
import * as fs from "fs";

export default class Storage {
  cxt: ExtensionContext;
  private savePath: Uri;

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
    console.log("write");

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
  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }

    return true;
  }
}
