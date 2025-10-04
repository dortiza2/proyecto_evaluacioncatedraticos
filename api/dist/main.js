"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [/^http:\/\/localhost:300\d$/],
        methods: ['GET'],
    });
    const port = process.env.PORT ? Number(process.env.PORT) : 4000;
    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`Stats API listening on http://localhost:${port}`);
}
bootstrap();
