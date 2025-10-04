"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const serverless_1 = require("@neondatabase/serverless");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let DatabaseService = class DatabaseService {
    constructor(configService) {
        this.configService = configService;
        const databaseUrl = this.configService.get('DATABASE_URL');
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not set');
        }
        this.sql = (0, serverless_1.neon)(databaseUrl);
    }
    async query(strings, ...params) {
        // Use tagged template to avoid SQL injection; pass params with placeholders
        // Example: await db.query`SELECT * FROM table WHERE id = ${id}`
        // @ts-ignore
        const result = await this.sql(strings, ...params);
        return result;
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseService);
