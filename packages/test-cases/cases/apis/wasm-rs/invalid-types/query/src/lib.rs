pub mod w3;
pub use w3::*;

pub fn bool_method(input: InputBoolMethod) -> bool {
    input.arg
}

pub fn int_method(input: InputIntMethod) -> i32 {
    input.arg
}

pub fn uint_method(input: InputUintMethod) -> u32 {
    input.arg
}

pub fn bytes_method(input: InputBytesMethod) -> Vec<u8> {
    input.arg
}

pub fn array_method(input: InputArrayMethod) -> Option<Vec<String>> {
    Some(input.arg)
}
