export default {
  auto: false, // 接管全部实现，用户不可修改输出目录代码，总是会被覆盖

  generateDefination: false, // 是否生成ts类型定义

  source: ["http://www.example.com/swagger.json"], // 数据源路径 - path / url / {name, from: path} ,

  out: "/exportApi",

  groupBy: "operationId",

  templates: {
    api: "/.s2a/templates/codeTemp.js",
    mock: "/.s2a/templates/mockTemp.js"
  },

  /**
   * path
   * --------
   * templatePlugin: '../../plugin.js'
   *
   * function
   * --------
   * templatePlugins: [function aaaa() {}, function bbb () {}],
   */
  templatePlugins: "../../plugin.js",

  /**
   * base on url
   * ---------------
   * excludeApi: ['test.api.com', 'mock.api.com']
   *
   * base on function
   * ---------------
   * excludeApi: {
   *  filter: ["methods", "url"],
   *  expression (metaBody) {
   *    return false
   *  }
   * }
   */
  excludeApi: ["test.api.com", "mock.api.com"]
}
