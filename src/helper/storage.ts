import { ExtensionContext, workspace, Uri } from "vscode";

export default class Storage {
  cxt: ExtensionContext;
  private savePath: Uri;

  constructor(cxt: ExtensionContext) {
    this.cxt = cxt;
    this.savePath = Uri.parse(`file://${this.cxt.storagePath}/swaggerMetaJSON`);
  }
  jsonToBuffer(json: object): Buffer | undefined {
    try {
      const str = JSON.stringify(json)
      return Buffer.from(str)
    } catch (error) {
      console.error(error)
    }
  }
  writeFile(content: Buffer) {
    return workspace.fs.writeFile(this.savePath, content);
  }
  readFile() {
    return workspace.fs.readFile(this.savePath);
  }
}
