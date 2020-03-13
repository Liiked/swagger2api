import { ExtensionContext, workspace, Uri, window } from "vscode"
import StoreManage from "../storeManage"
import ConverToApi from "./sourceDataProcessor"
import { isUrl } from "../helper/utils"

export default class SourceProvider {
  public cxt: ExtensionContext
  constructor(cxt: ExtensionContext, st?: StoreManage) {
    this.cxt = cxt
  }

  async save(path: string) {
    const convertTool = new ConverToApi()
    let data
    if (isUrl(path)) {
      const rawFilePath = await StoreManage.fetchAndSaveRemoteSource(path)
      data = await convertTool.convertPath(rawFilePath)
    } else {
      data = await convertTool.convertPath(Uri.parse(workspace.rootPath + path))
    }
    StoreManage.saveMetaJSON(data)

    console.log("SourceProvider: save", data)
    return data
  }
  read() {
    StoreManage.readMetaJSON()
  }

  parse() {}
  diff() {}
}
