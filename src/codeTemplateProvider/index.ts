import {
  workspace,
  ExtensionContext,
  Uri,
  WorkspaceFolder,
  window
} from "vscode"
import { cosmiconfigSync } from "cosmiconfig"
import prettier from "prettier"
import { isTempalte } from "../helper/utils"
import StoreManage from "../storeManage"
import path from "path"
import { parseModule } from "../codeTemplateProvider/swaggerAnalyser"
import { Config } from "../configProvider/processConfig"

export default class CodeTemplateProvider {
  public storeManage: StoreManage
  public cxt: ExtensionContext
  private config: Config | null
  public isInitated = false
  tempFiles = {
    codeTempPath: path.join(__dirname + "/codeTemp.js"),
    mockTempPath: path.join(__dirname + "/mockTemp.js")
  }
  codeTemp: string[] = [] // 代码模板路径
  docTemp: string[] = [] // 文档模板路径
  mockTemp: string[] = [] // mock模板路径

  constructor(cxt: ExtensionContext, config?: Config, st?: StoreManage) {
    this.storeManage = st || StoreManage.init(cxt)
    this.cxt = cxt
    this.config = config || null
  }

  async init() {
    const space = workspace.workspaceFolders
      ? workspace.workspaceFolders[0]
      : null
    if (!this.config) {
      this.config = await StoreManage.readUserConfig()
    }
    if (!space || !this.config) {
      return
    }
    this.codeTemp.push(this.config.templates + "/codeTemp.js")
    this.mockTemp.push(this.config.templates + "/mockTemp.js")
    this.isInitated = true
  }

  async export() {
    if (!this.config) {
      window.showErrorMessage("no config found")
      return
    }
    const { out } = this.config
    // TODO: 多目录区支持
    const workFolder = workspace.workspaceFolders
      ? workspace.workspaceFolders[0]
      : null
    if (!workFolder) {
      return
    }
    const [codeTemplatesPath, mockTemplates] = [
      this.codeTemp[0],
      this.mockTemp[0]
    ]
    if (codeTemplatesPath) {
      await this.exportCode(out, codeTemplatesPath)
    }
    window.showInformationMessage("code generated!")
    // TODO: 完成mock
    // if (mockTemplates) {
    //   this.exportMock( out)
    // }
  }

  async exportCode(outPath: string, templatePath: string): Promise<boolean> {
    const templateBuffer = await StoreManage.workSpaceRead(templatePath)
    const apiTemplate = templateBuffer.toString()
    if (!isTempalte(apiTemplate)) {
      window.showErrorMessage(
        "Template parse error: incorrect template identifier"
      )
    }
    let templateFn: () => {}
    try {
      templateFn = eval("(" + apiTemplate + ")")
    } catch (error) {
      window.showErrorMessage("template parse error: ", error)
      return false
    }
    const metaData = await StoreManage.readMetaJSON()
    if (!metaData) {
      window.showErrorMessage("no meta data found")
      return false
    }
    const prettierrcInstance = cosmiconfigSync("prettier")
    const result = prettierrcInstance.search(workspace.rootPath)
    console.log(result)
    const parsed = parseModule(metaData, templateFn)

    for (const key in parsed) {
      const el = parsed[key]
      const exportFile = prettier.format(el.join("\n"), result?.config)
      StoreManage.workSpaceSave(outPath + `/${key}.js`, exportFile)
    }
    return true
  }

  async exportMock(outPath: string) {}

  async exportOriginTemp() {
    const codeTempContent = await StoreManage.basicRead(
      Uri.parse(this.tempFiles.codeTempPath)
    )
    const mockTempContent = await StoreManage.basicRead(
      Uri.parse(this.tempFiles.mockTempPath)
    )
    return {
      codeTemp: codeTempContent.toString(),
      mockTemp: mockTempContent.toString()
    }
  }
  saveTemp() {}
  delTemp() {}
  readTemp() {}
}
