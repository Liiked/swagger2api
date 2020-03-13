import { ExtensionContext, workspace, Uri, window } from "vscode"
import { jsonToBuffer } from "../helper/utils"
import s2aConfig from "../configProvider/s2a.config"
import path from "path"
import { cosmiconfig } from "cosmiconfig"

import { Config } from "../configProvider/processConfig"
import axios from "axios"
import * as fs from "fs"

import { API } from "../types"
import { isObject } from "util"
import { STORE_MANAGE_ERROR } from "../errorMap"
import { fetchSwagger } from "../helper/request"

/**
 * The utils of whole ext excution store manager.
 */
export default class StoreManager {
  public cxt: ExtensionContext // context of ext

  // paths
  public workSpacePath: string | undefined
  public storagePath: string | undefined
  public metaDataPath: Uri // local transfered meta json
  public remoteInLocalPath: Uri // remote source file in local
  public userConfigPath: Uri // config in workspace
  public configPath = "" // TODO: 将config处理后导出 config in workspace

  constructor(cxt: ExtensionContext) {
    this.cxt = cxt

    this.workSpacePath = workspace.rootPath
    this.storagePath = this.cxt.storagePath
    this.metaDataPath = Uri.parse(`file://${this.storagePath}/swaggerMetaJSON`)
    this.remoteInLocalPath = Uri.parse(`file://${this.storagePath}/remoteFile`)
    this.userConfigPath = Uri.parse(
      `file://${workspace.rootPath}/s2a.config.js`
    )
  }

  /**
   * common methods
   */
  async basicRead(path: Uri) {
    return workspace.fs.readFile(path)
  }
  async basicSave(path: Uri, content: Buffer) {
    return workspace.fs.writeFile(path, Buffer.from(content))
  }
  async basicRemove(path: Uri) {
    return workspace.fs.delete(path)
  }

  async workSpaceRead(fileName: string) {
    const filePath = `${this.workSpacePath}${fileName}`
    const savePath = Uri.parse(filePath)
    // TODO: pathExists可能有问题
    if (!this.pathExists(savePath.fsPath)) {
      throw `StroeManager.workSpaceRead: Couldn't find file ${fileName}.`
    }

    return this.basicRead(savePath)
  }
  async workSpaceSave(fileName: string, content: any) {
    const path = Uri.parse(`file://${this.workSpacePath}/${fileName}`)
    return this.basicSave(path, Buffer.from(content))
  }
  async workSpaceRemove() {
    return this.basicRemove
  }

  /**
   * meta data
   */
  async saveMetaJSON(content: object) {
    return this.basicSave(this.metaDataPath, jsonToBuffer(content))
  }
  async readMetaJSON() {
    try {
      const d = await this.basicRead(this.metaDataPath)
      return JSON.parse(d.toString()) as API.List
    } catch (error) {
      console.log(error)
      if (error.name.test("EntryNotFound")) {
        window.showErrorMessage(STORE_MANAGE_ERROR.METADATA_NOT_FOUND)
      }
      window.showErrorMessage(error)
      return null
    }
  }
  async removeMetaJSON() {
    return fs.unlink(this.metaDataPath.path, e => {
      return e
    })
  }

  /**
   * remote data
   */
  async fetchAndSaveRemoteSource(url: string): Promise<Uri> {
    const result = await fetchSwagger(url)
    const fileExt = path.posix.parse(url).ext
    this.remoteInLocalPath = Uri.parse(
      this.storagePath + "/remoteFile" + fileExt
    )
    await this.saveRemoteSource(result)
    return this.remoteInLocalPath
  }
  async saveRemoteSource(content: any) {
    return this.basicSave(this.remoteInLocalPath, Buffer.from(content))
  }
  async readRemoteSource() {
    return this.basicRead(this.remoteInLocalPath)
  }
  async removeRemoteSource() {
    return this.saveMetaJSON(Buffer.from(""))
  }

  /**
   * user config
   */
  async saveUserConfig(config: Config) {
    if (this.pathExists(this.userConfigPath.fsPath)) {
      window.showInformationMessage("Config exists!")
      return
    }
    const configStr = JSON.stringify(config)
    const configTemp = `module.exports = ${configStr}`
    return this.basicSave(this.userConfigPath, Buffer.from(configTemp))
  }

  async readUserConfig() {
    if (!this.pathExists(this.userConfigPath.path)) {
      window.showErrorMessage("no config found")
      return null
    }
    const userConf = cosmiconfig("s2a")
    const data = await userConf.load(this.userConfigPath.fsPath)
    if (!isObject(data?.config)) {
      return null
    }
    return data?.config as Config
  }

  /**
   * other methods
   */
  pathExists(p: string): boolean {
    try {
      fs.accessSync(p)
    } catch (err) {
      return false
    }
    return true
  }
}
