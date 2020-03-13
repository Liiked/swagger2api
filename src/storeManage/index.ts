import { ExtensionContext, workspace, Uri, window } from "vscode"
import { jsonToBuffer, toStoreFileName } from "../helper/utils"
import s2aConfig from "../configProvider/s2a.config"
import path from "path"
import { cosmiconfig } from "cosmiconfig"

import { Config } from "../configProvider/processConfig"
import axios from "axios"
import * as fs from "fs"

import { API, StoreFileNames } from "../types"
import { isObject } from "util"
import { STORE_MANAGE_ERROR } from "../errorMap"
import { fetchSwagger } from "../helper/request"

/**
 * The utils of whole ext excution store manager.
 */
export default class StoreManager {
  static cxt: ExtensionContext // context of ext

  // paths
  static workSpacePath: string | undefined
  static storagePath: string | undefined
  static metaDataPath: Uri // local transfered meta json
  static remoteInLocalPath: Uri // remote source file in local
  static userConfigPath: Uri // config in workspace
  static configPath = "" // TODO: 将config处理后导出 config in workspace

  static init(cxt: ExtensionContext) {
    this.cxt = cxt

    this.workSpacePath = workspace.rootPath
    this.storagePath = this.cxt.storagePath
    this.metaDataPath = Uri.parse(
      `file://${this.storagePath}/${toStoreFileName(
        StoreFileNames.SourceFile.MetaFileName
      )}`
    )
    this.remoteInLocalPath = Uri.parse(
      `file://${this.storagePath}/${toStoreFileName(
        StoreFileNames.SourceFile.RemoteFileName
      )}`
    )
    this.userConfigPath = Uri.parse(
      `file://${workspace.rootPath}/s2a.config.js`
    )
    return this
  }

  /**
   * common methods
   */
  static async basicRead(path: Uri) {
    return workspace.fs.readFile(path)
  }
  static async basicSave(path: Uri, content: Buffer) {
    return workspace.fs.writeFile(path, Buffer.from(content))
  }
  static async basicRemove(path: Uri) {
    return workspace.fs.delete(path)
  }

  static async workSpaceRead(fileName: string) {
    const filePath = `${this.workSpacePath}${fileName}`
    const savePath = Uri.parse(filePath)
    // TODO: pathExists可能有问题
    if (!this.pathExists(savePath.fsPath)) {
      throw `StroeManager.workSpaceRead: Couldn't find file ${fileName}.`
    }

    return this.basicRead(savePath)
  }
  static async workSpaceSave(fileName: string, content: any) {
    const path = Uri.parse(`file://${this.workSpacePath}/${fileName}`)
    return this.basicSave(path, Buffer.from(content))
  }
  static async workSpaceRemove() {
    return this.basicRemove
  }

  /**
   * meta data
   */
  static async saveMetaJSON(content: object) {
    return this.basicSave(this.metaDataPath, jsonToBuffer(content))
  }
  static async readMetaJSON() {
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
  static async removeMetaJSON() {
    return fs.unlink(this.metaDataPath.path, e => {
      return e
    })
  }

  /**
   * remote data
   */
  static async fetchAndSaveRemoteSource(url: string): Promise<Uri> {
    const result = await fetchSwagger(url)
    const fileExt = path.posix.parse(url).ext
    this.remoteInLocalPath = Uri.parse(
      this.storagePath + "/remoteFile" + fileExt
    )
    await this.saveRemoteSource(result)
    return this.remoteInLocalPath
  }
  static async saveRemoteSource(content: any) {
    return this.basicSave(this.remoteInLocalPath, Buffer.from(content))
  }
  static async readRemoteSource() {
    return this.basicRead(this.remoteInLocalPath)
  }
  static async removeRemoteSource() {
    return this.saveMetaJSON(Buffer.from(""))
  }

  /**
   * user config
   */
  static async saveUserConfig(config: Config) {
    if (this.pathExists(this.userConfigPath.fsPath)) {
      window.showInformationMessage("Config exists!")
      return
    }
    const configStr = JSON.stringify(config)
    const configTemp = `module.exports = ${configStr}`
    return this.basicSave(this.userConfigPath, Buffer.from(configTemp))
  }

  static async readUserConfig() {
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
  static pathExists(p: string): boolean {
    try {
      fs.accessSync(p)
    } catch (err) {
      return false
    }
    return true
  }
}
