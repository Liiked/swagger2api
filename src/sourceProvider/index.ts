import { ExtensionContext, workspace, Uri, window } from "vscode";
import StoreManage from "../storeManage";
import ConverToApi from "./sourceDataProcessor";

export default class SourceProvider {
  public storeManage: StoreManage;
  public cxt: ExtensionContext;

  constructor(cxt: ExtensionContext, st?: StoreManage) {
    this.storeManage = st || new StoreManage(cxt);
    this.cxt = cxt;
  }

  async save(path: string) {
    const convertTool = new ConverToApi();
    const data = await convertTool.convertPath(
      Uri.parse(workspace.rootPath + path)
    );
    this.storeManage.saveMetaJSON(data);
    console.log("SourceProvider: save", data);
    return data;
  }
  read() {
    this.storeManage.readMetaJSON();
  }

  parse() {}
  diff() {}
}
