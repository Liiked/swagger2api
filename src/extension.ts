"use strict"

import * as vscode from "vscode"
import CodeTemplateProvider from "./template"
import { JsonDataProvider as TreeViewDataProvider } from "./view/treeview/treeViewData"
import StoreManage from "./store"
import { ConfigSelector } from "./view/selector"
import ErrorHandler from "./view/errorHandler"
import ConfigProvider, { parseUserInput } from "./configProvider"

export function activate(context: vscode.ExtensionContext) {
  console.log('swagger2api says "Hello"')
  console.log("storagePath:", context.storagePath)

  const { subscriptions } = context
  /**
   *
   * 初始化
   *
   */

  const treeProvider = new TreeViewDataProvider(vscode.workspace.rootPath || "")
  StoreManage.init(context)

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
      const storeManage = await StoreManage.init(context)
      const config = await storeManage.readUserConfig()
      if (!config) {
        return
      }
      const templateProvider = new CodeTemplateProvider(
        context,
        config,
        storeManage
      )
      await templateProvider.init()
      await templateProvider.export()
    })
  )
  subscriptions.push(
    vscode.commands.registerCommand(
      "s2a.test.viewManage.errorManage",
      async () => {
        ErrorHandler.showErrorMsg(
          "file goes wrong, please check detail",
          "script error"
        )
      }
    )
  )
  subscriptions.push(
    vscode.commands.registerCommand(
      "s2a.test.viewManage.configSelector",
      async () => {
        const storeManage = await StoreManage.init(context)
        const result = await ConfigSelector(context)
        const config = parseUserInput(result)
        if (!config) {
          return
        }
        await storeManage.saveUserConfig(config)
        new ConfigProvider(context).generateConfigFiles(config)
        console.log(config)
      }
    )
  )
  subscriptions.push(
    vscode.commands.registerCommand(
      "s2a.test.storeManage.genConfig",
      async () => {
        const storeManage = await StoreManage.init(context)
        storeManage.saveUserConfig({
          source: ["http://www.example.com/swagger.json"],
          out: "/exportApi",
          templates: "/.s2a/templates/template.js"
        })
      }
    )
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
}
