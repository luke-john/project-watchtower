# Changelog

## [v0.11.4] - 30/11/2017
- Fixed issue where undefined page properties can overwrite additional properties

## [v0.11.3] - 29/11/2017
- Fixed broken path when compiling downstream

## [v0.11.0] - 21/11/2017
- Include location in pageProps
- Include location in page events
- Allow page props to be passed to the page which get included in the page events
- Removed error boundaries on page, they are an experimental API which ties us to specific versions of React