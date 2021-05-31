declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BOT_API_TOKEN: string;
            API_URL: string;
        }
    }
}

export {}