pub mod polywrap;
pub use polywrap::*;

pub fn method1(input: InputMethod1) -> SanityEnum {
    input.en
}

pub fn method2(input: InputMethod2) -> Vec<SanityEnum> {
    input.enum_array
}
