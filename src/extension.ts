"use strict"

import * as vscode from "vscode"
import CodeTemplateProvider from "./CodeTemplateProvider"
import { JsonDataProvider as TreeViewDataProvider } from "./viewManage/treeview/treeViewData"
import StoreManage from "./storeManage"
import { ConfigSelector } from "./viewManage/selector"
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

  const storeManage = new StoreManage(context)

  const treeProvider = new TreeViewDataProvider(
    vscode.workspace.rootPath || "",
    storeManage
  )

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
      await templateProvider.init()
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
        storeManage.saveUserConfig({
          source: ["http://www.example.com/swagger.json"],
          out: "/exportApi",
          templates: "/.s2a/templates/template.js"
        })
      }
    )
  )
}
