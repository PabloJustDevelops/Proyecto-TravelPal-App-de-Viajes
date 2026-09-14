// Polyfill for TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for fetch
require("whatwg-fetch");

// Polyfill for URL
const { URL, URLSearchParams } = require("url");
global.URL = URL;
global.URLSearchParams = URLSearchParams;
