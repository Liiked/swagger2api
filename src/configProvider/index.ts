import { ExtensionContext, workspace, Uri, window } from "vscode"
import StoreManage from "../storeManage"
import { Config } from "./processConfig"
import { isUrl, isPath } from "../helper/utils"
import { isArray, isBoolean, isString } from "lodash"
import { UserInputState } from "../viewManage/selector"
import SourceProvider from "../sourceProvider"
import { SourcePath, TemplatePath } from "../configProvider/processConfig"
import CodeTemplateProvider from "../codeTemplateProvider"

export default class ConfigProvider {
  private storeManage: StoreManage
  private neccessaryConfig = ["source", "out", "templates"]
  private sourceProvider: SourceProvider
  private codeTemplateProvider: CodeTemplateProvider

  constructor(cxt: ExtensionContext) {
    this.storeManage = StoreManage.init(cxt)
    this.sourceProvider = new SourceProvider(cxt, this.storeManage)
    this.codeTemplateProvider = new CodeTemplateProvider(
      cxt,
      undefined,
      this.storeManage
    )
  }

  /**
   * initaite
   * @param cxt
   */
  async init(config?: Config) {
    const userConfig = config || (await StoreManage.readUserConfig())
    if (!userConfig) {
      throw "config data parse error!"
    }
    if (!this.validate(userConfig)) {
      throw "config validate failed!"
    }
    return {
      userConfig
    }
  }

  /**
   * validate config
   * @param config
   */
  validate(config: Config) {
    return this.integrityValidate(config) && this.legalityValidate(config)
  }

  /**
   * validate config integrity
   * @param config
   */
  integrityValidate(config: Config): boolean {
    const keys = Object.keys(config)
    // neccessary keys check
    if (!this.neccessaryConfig.every(d => keys.includes(d))) {
      return false
    }

    const { control, generateDefination, source, out, templates } = config
    if (!isArray(source) && !isString(source)) {
      return false
    }
    if (!isString(out)) {
      return false
    }
    if (!isArray(templates) && !isString(templates)) {
      return false
    }
    if (control && !isBoolean(control)) {
      return false
    }
    if (generateDefination && !isBoolean(generateDefination)) {
      return false
    }
    return true
  }

  /**
   * validate config legality
   * @param config
   */
  legalityValidate(config: Config): boolean {
    const { source, out, templates } = config
    if (typeof source === "string" && !isPath(source)) {
      window.showErrorMessage("source illegal")
      return false
    }
    if (typeof out === "string" && !isPath(out)) {
      window.showErrorMessage("out illegal")
      return false
    }
    if (typeof templates === "string" && !isPath(templates)) {
      window.showErrorMessage("templates illegal")
      return false
    }
    return true
  }

  /**
   * inject template files to workspace
   */
  async generateConfigFiles(userConfig?: Config) {
    const config = userConfig || (await StoreManage.readUserConfig())
    if (!config) {
      return
    }
    await this.generateMetaFiles(config.source)
    await this.generateTemplateFiles(config.templates)
  }
  /**
   * generate s2a meta files
   * @param sourcePath
   */
  async generateMetaFiles(sourcePath: string | string[] | SourcePath[]) {
    if (isString(sourcePath)) {
      await this.sourceProvider.save(sourcePath)
    }
    if (isArray(sourcePath) && isString(sourcePath[0])) {
      await this.sourceProvider.save(sourcePath[0])
    }
    console.log("Meta Files Generated!")
  }

  /**
   * generate final export code folder
   * @param outPath
   */
  async generateOutFiles(outPath: string) {}

  /**
   * generate code template folder & files
   * @param tempPath
   */
  async generateTemplateFiles(tempPath: string | TemplatePath[]) {
    if (!this.codeTemplateProvider.isInitated) {
      await this.codeTemplateProvider.init()
    }
    const {
      codeTemp,
      mockTemp
    } = await this.codeTemplateProvider.exportOriginTemp()
    if (isString(tempPath)) {
      await StoreManage.workSpaceSave(tempPath + "/codeTemp.js", codeTemp)
      await StoreManage.workSpaceSave(tempPath + "/mockTemp.js", mockTemp)
      console.log("Tempalte Files Generated!")
    }
  }
}

/**
 * make user config by selectors
 * @param inputs
 */
export function parseUserInput(inputs: UserInputState): Config | void {
  const { sourcePath, sourceFrom, outPath } = inputs

  return {
    source: sourcePath,
    out: outPath,
    templates: "/.s2a/templates" // TODO: templates file structure
  }
}
