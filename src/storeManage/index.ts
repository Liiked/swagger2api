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
  async basicRemove() {}

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
  async workSpaceRemove() {}

  /**
   * meta data
   */
  async saveMetaJSON(content: object) {
    return this.basicSave(this.metaDataPath, jsonToBuffer(content))
  }
  async readMetaJSON() {
    return this.basicRead(this.metaDataPath).then(d => {
      try {
        return JSON.parse(d.toString()) as API.List
      } catch (error) {
        return null
      }
    })
  }
  async removeMetaJSON() {
    return this.saveMetaJSON(Buffer.from(""))
  }

  /**
   * remote data
   */
  async saveRemoteSource(content: object) {
    return this.basicSave(this.remoteInLocalPath, jsonToBuffer(content))
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
    if (!this.pathExists(this.userConfigPath.fsPath)) {
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
   * fetch
   */
  // TODO: 完成fetch
  async fetch(url: string): Promise<Uri> {
    const result = await axios.get(url)
    const { data } = result
    const savePath = Uri.parse(this.storagePath + "/remoteSourceData.yaml")
    await this.basicSave(savePath, Buffer.from(data))
    return savePath
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