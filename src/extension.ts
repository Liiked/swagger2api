"use strict"

import * as vscode from "vscode"
import ConverToApi from "./sourceProvider/sourceDataProcessor"
import SourceProvider from "./sourceProvider"
import { readFileSync } from "fs"
import { parseModule } from "./codeTemplateProvider/swaggerAnalyser"
import CodeTemplateProvider from "./CodeTemplateProvider"
import { JsonDataProvider as TreeViewDataProvider } from "./viewManage/treeview/treeViewData"
import { Fetch } from "./storeManage/fetch"
import Storage from "./storeManage/storage"
import StoreManage from "./storeManage"
import SourceDataFetch from "./storeManage/sourceDataFetch"
import { ConfigSelector } from "./viewManage/selector"
import ConfigProvider, { parseUserInput } from "./configProvider"

import { showQuickPick, showInputBox } from "./viewManage/selector/basicInput"
// import { multiStepInput } from "./viewManage/selector/multiStepInput";
import { quickOpen } from "./viewManage/selector/quickOpen"

export function activate(context: vscode.ExtensionContext) {
  console.log('swagger2api says "Hello"')
  console.log(context.storagePath)

  const { subscriptions } = context

  const convertTool = new ConverToApi()

  /**
   *
   * 初始化
   *
   */

  const storeManage = new StoreManage(context)

  const saveFile: Storage = new Storage(context)
  const treeProvider = new TreeViewDataProvider(
    vscode.workspace.rootPath || "",
    saveFile
  )

  // 远程数据
  const fetch = new Fetch(context)

  // 树视图
  vscode.window.registerTreeDataProvider("swaggerToApi", treeProvider)
  vscode.commands.registerCommand("s2a.test.refresh", () =>
    treeProvider.refresh()
  )

  /**
   *
   * 提交事件
   *
   **/
  subscriptions.push(
    vscode.commands.registerCommand("s2a.test.export", async () => {
      const config = await storeManage.readUserConfig()
      if (!config) {
        return
      }
      const templateProvider = new CodeTemplateProvider(
        context,
        config,
        storeManage
      )
      await templateProvider.export()
    })
  )
  subscriptions.push(
    vscode.commands.registerCommand(
      "s2a.test.configProvider.genMetaData",
      async () => {
        const configProvider = new ConfigProvider(context)
        const config = await configProvider.init()
        configProvider.generateMetaFiles(config.userConfig.source)
      }
    )
  )
  subscriptions.push(
    vscode.commands.registerCommand(
      "s2a.test.viewManage.configSelector",
      async () => {
        const result = await ConfigSelector(context)
        const config = parseUserInput(result)
        if (!config) {
          return
        }
        storeManage.saveUserConfig(config)
        new ConfigProvider(context).generateConfigFiles(config)
        console.log(config)
      }
    )
  )
  subscriptions.push(
    vscode.commands.registerCommand(
      "s2a.test.storeManage.genConfig",
      async () => {
        storeManage.saveUserConfig({
          source: ["http://www.example.com/swagger.json"],
          out: "/exportApi",
          templates: "/.s2a/templates/template.js"
        })
      }
    )
  )

  // 获取数据源-选择一个文件
  subscriptions.push(
    vscode.commands.registerCommand("s2a.fetchSourceBySelect", async _ => {
      // read file content
      try {
        SourceDataFetch.fromSelectFile()
      } catch (error) {
        vscode.window.showErrorMessage(error.message)
      }
    })
  )

  // 获取数据源-远程数据源
  subscriptions.push(
    vscode.commands.registerCommand("s2a.fetchSourceData", async () => {
      try {
        SourceDataFetch.fromRemoteFile(context)
      } catch (error) {
        vscode.window.showErrorMessage(error.message)
      }
    })
  )
}
