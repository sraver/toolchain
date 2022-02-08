import { parseCurrentType, parseMapType, toGraphQLType } from "../extract/utils/map-utils";

describe("parseMapType", () => {
  test("Map<String, Int>", () => {
    const result = parseMapType("Map<String, Int>");
    expect(result).toMatchObject({
      type: "Map<String, Int>",
      key: {
        type: "String",
      },
      value: {
        type: "Int",
      },
    });
  });

  test("Map<String, CustomType!>", () => {
    const result = parseMapType("Map<String, CustomType!>");
    expect(result).toMatchObject({
      type: "Map<String, CustomType>",
      key: {
        type: "String",
      },
      value: {
        type: "CustomType",
        required: true,
      },
    });
  });

  test("Map<Int, Array<String>!>", () => {
    const result = parseMapType("Map<Int, Array<String>!>");
    expect(result).toMatchObject({
      type: "Map<Int, [String]>",
      key: {
        type: "Int",
      },
      value: {
        type: "[String]",
        item: {
          type: "String",
        },
        required: true,
      }
    });
  });

  test("Map<Int, [String]!>", () => {
    const result = parseMapType("Map<Int, [String]!>");
    expect(result).toMatchObject({
      type: "Map<Int, [String]>",
      key: {
        type: "Int",
      },
      value: {
        type: "[String]",
        item: {
          type: "String",
        },
        required: true,
      }
    });
  });

  test("Map<CustomType, String!>", () => {
    expect(() => parseMapType("Map<CustomType, String!>")).toThrow(
      "Found invalid map key type: CustomType while parsing Map<CustomType, String!>"
    );
  });
});


describe("toGraphQLType", () => {
  test("Map<String, Int>", () => {
    const result = toGraphQLType("Map<String, Int>");
    expect(result).toBe("Map<String, Int>");
  });

  test("Map<String, CustomType!>", () => {
    const result = toGraphQLType("Map<String, CustomType!>");
    expect(result).toBe("Map<String, CustomType>");
  });

  test("Map<Int, Array<String>!>", () => {
    const result = toGraphQLType("Map<Int, Array<String>!>");
    expect(result).toBe("Map<Int, [String]>");
  });

  test("Array<String!>!", () => {
    const result = toGraphQLType("Array<String!>!");
    expect(result).toBe("[String]");
  });
})

describe("parseCurrentType", () => {
  test("Map<String, Int>", () => {
    const result = parseCurrentType("Map<String, Int>");
    expect(result).toMatchObject({
      currentType: "Map",
      subType: "String, Int",
      required: false,
    });
  });

  test("Map<String, CustomType!>", () => {
    const result = parseCurrentType("Map<String, CustomType!>");
    expect(result).toMatchObject({
      currentType: "Map",
      subType: "String, CustomType!",
      required: false
    });
  });

  test("Map<Int, Array<String>!>!", () => {
    const result = parseCurrentType("Map<Int, Array<String>!>!");
    expect(result).toMatchObject({
      currentType: "Map",
      subType: "Int, Array<String>!",
      required: true,
    });
  });

  test("Array<String!>!", () => {
    const result = parseCurrentType("Array<String!>!");
    expect(result).toMatchObject({
      currentType: "Array",
      subType: "String!",
      required: true,
    });
  });

  test("CustomType!", () => {
    const result = parseCurrentType("CustomType!");
    expect(result).toMatchObject({
      currentType: "CustomType",
      subType: null,
      required: true,
    });
  });

  test("String", () => {
    const result = parseCurrentType("String");
    expect(result).toMatchObject({
      currentType: "String",
      subType: null,
      required: false,
    });
  });
});