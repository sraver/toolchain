import {
  Read,
  Write,
  Nullable,
  BigInt,
  BigNumber,
  JSON,
  JSONSerializer,
  JSONDeserializer,
} from "@web3api/wasm-as";
import {
  serializeMutationEnv,
  deserializeMutationEnv,
  writeMutationEnv,
  readMutationEnv
} from "./serialization";
import * as Types from "..";

@serializable
export class MutationEnv {
  mutStr: string;
  str: string;
  optStr: string | null;
  optFilledStr: string | null;
  m_number: i8;
  optNumber: Nullable<i8>;
  m_bool: bool;
  optBool: Nullable<bool>;
  en: Types.EnvEnum;
  optEnum: Nullable<Types.EnvEnum>;
  object: Types.EnvObject;
  optObject: Types.EnvObject | null;
  array: Array<u32>;

  static toBuffer(type: MutationEnv): ArrayBuffer {
    return serializeMutationEnv(type);
  }

  static fromBuffer(buffer: ArrayBuffer): MutationEnv {
    return deserializeMutationEnv(buffer);
  }

  static write(writer: Write, type: MutationEnv): void {
    writeMutationEnv(writer, type);
  }

  static read(reader: Read): MutationEnv {
    return readMutationEnv(reader);
  }

  static toJson(type: MutationEnv): JSON.Value {
    return JSONSerializer.encode(type);
  }

  static fromJson(json: JSON.Value): MutationEnv {
    return (new JSONDeserializer(json)).decode<MutationEnv>();
  }
}
