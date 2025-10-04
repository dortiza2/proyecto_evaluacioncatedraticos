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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("./database.service");
let StatsController = class StatsController {
    constructor(db) {
        this.db = db;
    }
    async getTeachers() {
        const rows = await this.db.query `
      SELECT DISTINCT nombre_catedratico
      FROM encuestas_catedraticos
      ORDER BY nombre_catedratico
    `;
        return rows.map(r => r.nombre_catedratico);
    }
    async getSummary() {
        const rows = await this.db.query `
      SELECT 
        ROUND(COALESCE(AVG((manejo_tema+claridad_explicar+dominio_clase+interaccion_estudiantes+uso_recursos)/5.0), 0), 2) AS promedio_general,
        COUNT(*) AS total_evaluaciones
      FROM encuestas_catedraticos
    `;
        const row = rows[0] || { promedio_general: 0, total_evaluaciones: 0 };
        return row;
    }
    async getTable(teacher) {
        if (teacher && teacher.trim().length > 0) {
            const rows = await this.db.query `
        SELECT 
          nombre_catedratico,
          curso,
          ROUND(AVG((manejo_tema+claridad_explicar+dominio_clase+interaccion_estudiantes+uso_recursos)/5.0),2) AS promedio,
          COUNT(*) AS calificaciones
        FROM encuestas_catedraticos
        WHERE nombre_catedratico = ${teacher}
        GROUP BY nombre_catedratico, curso
        ORDER BY nombre_catedratico, curso
      `;
            return rows;
        }
        const rows = await this.db.query `
      SELECT 
        nombre_catedratico,
        curso,
        ROUND(AVG((manejo_tema+claridad_explicar+dominio_clase+interaccion_estudiantes+uso_recursos)/5.0),2) AS promedio,
        COUNT(*) AS calificaciones
      FROM encuestas_catedraticos
      GROUP BY nombre_catedratico, curso
      ORDER BY nombre_catedratico, curso
    `;
        return rows;
    }
};
exports.StatsController = StatsController;
__decorate([
    (0, common_1.Get)('teachers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getTeachers", null);
__decorate([
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('table'),
    __param(0, (0, common_1.Query)('teacher')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getTable", null);
exports.StatsController = StatsController = __decorate([
    (0, common_1.Controller)('stats'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], StatsController);
