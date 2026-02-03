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

// Mock Env Vars for Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
