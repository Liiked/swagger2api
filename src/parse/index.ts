import { ExtensionContext, workspace, Uri, window } from "vscode"
import StoreManage from "../store"
import ConverToApi from "./sourceDataProcessor"
import { isUrl } from "../helper/utils"
import path from "path"

export default class SourceProvider {
  public cxt: ExtensionContext
  constructor(cxt: ExtensionContext, st?: StoreManage) {
    this.cxt = cxt
  }

  async save(p: string) {
    const convertTool = new ConverToApi()
    const reslovedPath = path.posix.parse(p)
    let data
    if (isUrl(p)) {
      const rawFilePath = await StoreManage.fetchAndSaveRemoteSource(p)
      data = await convertTool.convertPath(rawFilePath)
    } else {
      if (workspace.rootPath) {
        data = await convertTool.convertPath(
          Uri.parse(workspace.rootPath + path)
        )
      } else {
        throw "no workspace"
      }
    }
    if (!data) {
      return
    }
    StoreManage.saveMetaJSON(reslovedPath.name + reslovedPath.ext, data)

    console.log("SourceProvider: save", data)
    return data
  }
  read() {
    StoreManage.readMetaJSON()
  }

  parse() {}
  diff() {}
}
