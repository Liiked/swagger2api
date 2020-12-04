import path from "path"
import { ExtensionContext, workspace, Uri, window } from "vscode"
import {
  jsonToBuffer,
  encodeStoreFileName,
  decodeStoreFileName
} from "../helper/utils"
import s2aConfig from "../configProvider/s2a.config"
import { cosmiconfig } from "cosmiconfig"
import { traverse, Traverse } from "fs-tree-utils"

import { Config } from "../configProvider/processConfig"
import * as fs from "fs"

import { API, StoreFileNames } from "../types"
import { isObject } from "util"
import { STORE_MANAGE_ERROR } from "../errorMap"
import { fetchSwagger } from "../helper/request"

export enum FileType {
  metaData,
  remoteFile
}

export enum FileVersion {
  new = "new",
  cur = "cur"
}

interface StoreFileItem {
  type: FileType
  version: FileVersion
  fileName: string
  path: string
}

type storeFileList = {
  metaFiles: StoreFileItem[]
  remoteFiles: StoreFileItem[]
}

/**
 * The utils of whole ext excution store manager.
 */
export default class StoreManager {
  static cxt: ExtensionContext // context of ext

  // paths
  static workSpacePath: string | undefined
  static storagePath: string | undefined
  // static metaDataBasePath: Uri // local transfered meta json
  static remoteInLocalPath: Uri // remote source file in local
  static userConfigPath: Uri // config in workspace
  static configPath = "" // TODO: 将config处理后导出 config in workspace
  static allStoredFiles: storeFileList = {
    metaFiles: [],
    remoteFiles: []
  }

  static async init(cxt: ExtensionContext) {
    this.cxt = cxt

    this.workSpacePath = workspace.rootPath
    this.storagePath = this.cxt.storagePath
    // this.metaDataBasePath = Uri.parse(
    //   `file://${this.storagePath}/${encodeStoreFileName(
    //     FileType.metaData,
    //     FileVersion.cur,
    //     StoreFileNames.SourceFile.MetaFileName
    //   )}`
    // )
    // this.remoteInLocalPath = Uri.parse(
    //   `file://${this.storagePath}/${encodeStoreFileName(
    //     FileType.remoteFile,
    //     FileVersion.cur,
    //     StoreFileNames.SourceFile.RemoteFileName
    //   )}`
    // )
    this.userConfigPath = Uri.parse(
      `file://${workspace.rootPath}/s2a.config.js`
    )
    await this.searchAllStoredFiles()
    return this
  }

  // batch file methods

  static async searchAllStoredFiles() {
    if (this.storagePath) {
      const res = await traverse(this.storagePath)
      const pathObj = res.map(d => decodeStoreFileName(d.item, d.path))
      const metaFiles = pathObj.filter(
        d => Number(d.type) === FileType.metaData
      ) as StoreFileItem[]
      const remoteFiles = pathObj.filter(
        d => Number(d.type) === FileType.remoteFile
      ) as StoreFileItem[]
      this.allStoredFiles = {
        metaFiles,
        remoteFiles
      }
      return res
    }
    throw "no storagePath"
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
  static async saveMetaJSON(fileName: string, content: object) {
    const savePath = Uri.parse(
      `file://${this.storagePath}/${encodeStoreFileName(
        FileType.metaData,
        FileVersion.cur,
        fileName
      )}`
    )
    return this.basicSave(savePath, jsonToBuffer(content))
  }
  static async readMetaJSON() {
    if (!this.allStoredFiles.metaFiles.length) {
      window.showErrorMessage("no meta file")
      return null
    }
    try {
      const d = await this.basicRead(
        Uri.parse(this.allStoredFiles.metaFiles[0].path)
      )
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
  static async removeMetaJSON(path: Uri) {
    return workspace.fs.delete(path)
  }

  /**
   * remote data
   */
  static async fetchAndSaveRemoteSource(url: string): Promise<Uri> {
    const result = await fetchSwagger(url)
    const { name, ext } = path.posix.parse(url)
    this.remoteInLocalPath = Uri.parse(
      `file://${this.storagePath}/${encodeStoreFileName(
        FileType.remoteFile,
        FileVersion.cur,
        name + ext
      )}`
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
  static async removeRemoteSource(fileName: string) {
    return workspace.fs.delete(
      Uri.parse(
        `file://${this.storagePath}/${encodeStoreFileName(
          FileType.metaData,
          FileVersion.cur,
          fileName
        )}`
      )
    )
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
