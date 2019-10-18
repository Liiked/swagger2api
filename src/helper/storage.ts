import { ExtensionContext, workspace, Uri } from "vscode";

export default class Storage {
  cxt: ExtensionContext;
  private savePath: Uri;

  constructor(cxt: ExtensionContext) {
    this.cxt = cxt;
    this.savePath = Uri.parse(`file://${this.cxt.storagePath}/swaggerMetaJSON`);
  }

  writeFile(content: Buffer) {
    return workspace.fs.writeFile(this.savePath, content);
  }
  readFile() {
    return workspace.fs.readFile(this.savePath);
  }
}
