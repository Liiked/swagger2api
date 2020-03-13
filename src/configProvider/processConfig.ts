import { Uri, workspace } from "vscode"

interface PathObject {
  path: string
  out: string
}

export interface SourcePath extends PathObject {
  from: string
}

export interface TemplatePath extends PathObject {
  out: string
  templatePath: string
  excludeApiPath: string[]
}

export type Config = {
  source: string | string[] | SourcePath[]
  out: string
  templates: TemplatePath[] | string
  groupBy?: "operationId"
  control?: boolean
  generateDefination?: boolean
  excludeApiPath?: string[]
}

export default class ProcessConfig {
  private configPath: Uri // 配置文件路径
  private control: boolean // 接管模式
  private useTypes: boolean // 生成ts
  private source = [] // 源数据路径
  private out: Uri // 输出文件夹
  private templates = [] // 输出模板
  constructor(configPath: string) {
    this.configPath = Uri.parse(configPath)
    this.control = false
    this.useTypes = false
    this.out = Uri.parse("")
  }
  // 将默认文件存入工作区
  static saveDefault() {}

  // 扫描和检查文件
  private scan() {}

  // 加载默认文件
  private loadDefault() {}
}
