pub mod api;
pub mod client;
pub mod error;
pub mod interface_implementations;
pub mod invoke;
pub mod maybe_async;
pub mod plugin;
pub mod plugin_registration;
pub mod query;
pub mod uri;
pub mod uri_redirect;

// temporary
pub trait QueryHandler: Clone {}

pub use client::Client;
pub use invoke::{InvokableModules, InvokeApiOptions, InvokeApiResult, InvokeHandler};
//pub use maybe_async::MaybeAsync;
pub use interface_implementations::InterfaceImplementations;
pub use plugin::PluginPackage;
pub use plugin_registration::PluginRegistration;
pub use uri::Uri;
pub use uri_redirect::UriRedirect;
