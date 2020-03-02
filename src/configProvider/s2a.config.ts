export default {
  control: false, // 接管全部实现，用户不可修改输出目录代码，总是会被覆盖
  generateDefination: false, // 是否生成ts类型定义
  source: ["http://www.example.com/swagger.json"], // 数据源路径 - path / url / {name, from: path} ,
  out: "/exportApi",
  // 不导出api的规则, glob
  // excludeApiPath: ["**/path"],
  // 转换模板，path / url / {name, from: path}
  templates: "/exportApi/templates/template.js"
  // templates: [
  //   {
  //     out: "/mock",
  //     templatePath: "",
  //     excludeApiPath: []
  //   },
  //   {
  //     out: "/service",
  //     templatePath: "",
  //     excludeApiPath: []
  //   }
  // ]
};

// module.exports = {
//   control: false, // 接管全部实现，用户不可修改输出目录代码，总是会被覆盖
//   generateDefination: false, // 是否生成ts类型定义
//   source: ["http://www.example.com/swagger.json"], // 数据源路径 - path / url / {name, from: path} ,
//   out: "/exportApi",
//   // 不导出api的规则, glob
//   // excludeApiPath: ["**/path"],
//   // 转换模板，path / url / {name, from: path}
//   templates: "/exportApi/templates/template.js"
//   // templates: [
//   //   {
//   //     out: "/mock",
//   //     templatePath: "",
//   //     excludeApiPath: []
//   //   },
//   //   {
//   //     out: "/service",
//   //     templatePath: "",
//   //     excludeApiPath: []
//   //   }
//   // ]
// };
