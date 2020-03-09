import { workspace, ExtensionContext, Uri } from "vscode";
import StoreManage from "../storeManage";
import path from "path";

export default class CodeTemplateProvider {
  public storeManage: StoreManage;
  public cxt: ExtensionContext;
  tempFiles = {
    codeTempPath: path.join(__dirname + "/codeTemp.js"),
    mockTempPath: path.join(__dirname + "/mockTemp.js")
  };
  codeTemp = []; // 代码模板
  docTemp = []; // 文档模板
  mockTemp = []; // mock模板

  constructor(cxt: ExtensionContext, st?: StoreManage) {
    this.storeManage = st || new StoreManage(cxt);
    this.cxt = cxt;
  }
  async exportOriginTemp() {
    const codeTempContent = await this.storeManage.basicRead(
      Uri.parse(this.tempFiles.codeTempPath)
    );
    const mockTempContent = await this.storeManage.basicRead(
      Uri.parse(this.tempFiles.mockTempPath)
    );
    return {
      codeTemp: codeTempContent.toString(),
      mockTemp: mockTempContent.toString()
    };
  }
  saveTemp() {}
  delTemp() {}
  readTemp() {}
}
