interface ProccessedData {
  [param: string]: any;
  name: string;
  schema: Schema;
  required: boolean;
  description: string;
  properties: object;
  "200": {
    content: Property;
    schema: Schema;
  };
  content: {
    "application/json": {
      schema: Schema;
    };
  };
}

interface Schema {
  $ref: string;
  type: string;
}

interface Property {
  [param: string]: any;
}

interface Items {
  name: string;
  type: string;
  description: string;
  required: boolean;
  subItems?: Items[];
}

export function paramFactory(obj: ProccessedData | ProccessedData[]) {
  if (!obj) {
    return [];
  }
  return (obj as any[]).map((d: ProccessedData) => ({
    name: d.name,
    type: d.schema.type,
    required: d.required,
    description: d.description
  }));
}

export function payloadFactory(
  obj: ProccessedData | ProccessedData[],
  fullObj: ProccessedData
) {
  if (!obj) {
    return [];
  }
  const ref = (obj as ProccessedData).content["application/json"].schema.$ref;
  const requestBody = retriveJSON(fullObj, parseRef(ref));
  return extractParamFromRequest(requestBody, fullObj);
}

export function returnFactory(obj: ProccessedData, fullObj: ProccessedData) {
  const successObj = obj["200"];
  const schema = Object.values(successObj.content)[0].schema;
  const ref = schema.$ref;
  if (ref) {
    const returnData = retriveJSON(fullObj, parseRef(ref));
    return extractParamFromRequest(returnData, fullObj);
  }
  return [];
}

export function parseModule(modules: Property, parser: (obj: object) => {}) {
  const apiObj: Property = {};
  for (const key in modules) {
    const apis = modules[key];

    const apiMaps = apis.map((e: object) => {
      return parser(e);
    });
    apiObj[key] = apiMaps;
  }
  return apiObj;
}

function extractParamFromRequest(
  obj: ProccessedData,
  fullObj: ProccessedData
): Items[] {
  const { properties, description: desc, required } = obj;
  const allJSONFile = fullObj;
  if (!properties) {
    return [];
  }
  return Object.keys(properties).map(name => {
    const { type, items, description: subDesc } = (properties as Property)[
      name
    ];
    let innerItem = null;

    if (type === "array") {
      if (items.type === "object") {
        const subItem: Items[] = extractParamFromRequest(items, allJSONFile);
        innerItem = subItem;
      } else {
        const subItem = items.$ref
          ? extractParamFromRequest(
              retriveJSON(allJSONFile, parseRef(items.$ref)),
              allJSONFile
            )
          : {
              type: items.type
            };
        innerItem = subItem;
      }
    }

    if (items && items.$ref) {
      const subItem = items.$ref
        ? extractParamFromRequest(
            retriveJSON(allJSONFile, parseRef(items.$ref)),
            allJSONFile
          )
        : {
            type: items.type
          };
      innerItem = subItem;
    }

    return Object.assign(
      {
        name,
        type,
        description: subDesc ? subDesc : desc,
        required
      },
      {
        subItems: innerItem
      }
    );
  });
}

function parseRef(path: string): string[] {
  return path
    .replace(/#/, "")
    .replace(/\//, "")
    .split("/");
}

function retriveJSON(obj: ProccessedData, path: string[]): ProccessedData {
  if (path.length > 1) {
    return retriveJSON(obj[path.shift() as string], path);
  }
  return obj[path.shift() as string];
}
