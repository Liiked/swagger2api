import { quickListSelect, quickInput, quickFileSelect } from "./query";

export default class CommonQuery {
  static dataSource = "";
  // 数据源相关
  static async inputRemoteDatasource() {
    const url = await quickInput({
      placeHolder: "Input Remote Source URL, end with .json/.yaml"
    });
    this.dataSource = String(url);
    return url;
  }
  static async inputLocalDatasource() {
    const path = await quickFileSelect();
    return path;
  }
}
