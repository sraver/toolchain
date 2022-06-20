import { TypeInfo, isEnvType, createEnvDefinition } from "../typeInfo";
import {
  extractFieldDefinition,
  extractListType,
  extractNamedType,
  State,
} from "./utils/object-types-utils";

import {
  ObjectTypeDefinitionNode,
  NonNullTypeNode,
  NamedTypeNode,
  ListTypeNode,
  FieldDefinitionNode,
  ASTVisitor,
} from "graphql";

const visitorEnter = (typeInfo: TypeInfo, state: State) => ({
  ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => {
    const typeName = node.name.value;

    if (isEnvType(typeName)) {
      typeInfo.envType = createEnvDefinition({});
      state.currentType = typeInfo.envType;
    }
  },
  NonNullType: (_node: NonNullTypeNode) => {
    state.nonNullType = true;
  },
  NamedType: (node: NamedTypeNode) => {
    extractNamedType(node, state);
  },
  ListType: (_node: ListTypeNode) => {
    extractListType(state);
  },
  FieldDefinition: (node: FieldDefinitionNode) => {
    extractFieldDefinition(node, state);
  },
});

const visitorLeave = (state: State) => ({
  ObjectTypeDefinition: (_node: ObjectTypeDefinitionNode) => {
    state.currentType = undefined;
  },
  FieldDefinition: (_node: FieldDefinitionNode) => {
    state.currentProperty = undefined;
  },
  NonNullType: (_node: NonNullTypeNode) => {
    state.nonNullType = false;
  },
});

export function getEnvVisitor(typeInfo: TypeInfo): ASTVisitor {
  const state: State = {};

  return {
    enter: visitorEnter(typeInfo, state),
    leave: visitorLeave(state),
  };
}
