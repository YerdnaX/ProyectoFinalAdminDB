-- ============================================================
-- SISTEMA DE MATRICULA UNIVERSITARIA
-- Script de datos de prueba
-- Motor: SQL Server  |  Encoding: UTF-8
-- Ejecutar despues de CreadorBaseDatos.sql
-- ============================================================

USE SistemaMatriculaUniversitaria;
GO

-- ============================================================
-- 1. ROLES
-- ============================================================
INSERT INTO rol (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Docente',       'Gestion academica y consulta de secciones'),
('Estudiante',    'Proceso de matricula y consulta de estado de cuenta'),
('Finanzas',      'Gestion de facturas, pagos y estados de cuenta');
GO

-- ============================================================
-- 2. PERMISOS
-- ============================================================
INSERT INTO permiso (nombre, descripcion) VALUES
('GESTION_USUARIOS',        'Permite crear, modificar y consultar usuarios'),      -- 1
('GESTION_ROLES',           'Permite administrar roles y permisos'),               -- 2
('GESTION_PROGRAMAS',       'Permite administrar programas academicos'),           -- 3
('GESTION_PLANES',          'Permite administrar planes de estudio'),              -- 4
('GESTION_CURSOS',          'Permite administrar cursos'),                         -- 5
('GESTION_SECCIONES',       'Permite administrar secciones y horarios'),           -- 6
('MATRICULAR_CURSOS',       'Permite realizar matricula'),                         -- 7
('CONSULTAR_ESTADO_CUENTA', 'Permite ver estado de cuenta'),                       -- 8
('REGISTRAR_PAGOS',         'Permite registrar pagos'),                            -- 9
('GENERAR_FACTURAS',        'Permite generar facturas'),                           -- 10
('CONSULTAR_AUDITORIA',     'Permite consultar bitacora');                         -- 11
GO

-- ============================================================
-- 3. ROL_PERMISO
-- ============================================================
-- Administrador: todos los permisos
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT 1, id_permiso FROM permiso;

-- Docente: gestion de cursos y secciones
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
(2, 5),  -- GESTION_CURSOS
(2, 6);  -- GESTION_SECCIONES

-- Estudiante: matricula y consulta financiera
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
(3, 7),  -- MATRICULAR_CURSOS
(3, 8);  -- CONSULTAR_ESTADO_CUENTA

-- Finanzas: estado de cuenta, pagos y facturas
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
(4, 8),  -- CONSULTAR_ESTADO_CUENTA
(4, 9),  -- REGISTRAR_PAGOS
(4, 10); -- GENERAR_FACTURAS
GO

-- ============================================================
-- 4. USUARIOS
--    id_rol: 1=Admin, 2=Docente, 3=Estudiante, 4=Finanzas
-- ============================================================
INSERT INTO usuario (id_rol, identificador_sso, nombre, apellido, correo, activo, fecha_creacion) VALUES
(1, 'sso.admin01', 'Laura',    'Mora Solano',     'laura.mora@universidad.ac.cr',          1, '2026-01-05 08:00:00'), -- id 1 Admin
(4, 'sso.fin01',   'Carlos',   'Jimenez Ulate',   'carlos.jimenez@universidad.ac.cr',      1, '2026-01-05 08:05:00'), -- id 2 Finanzas
(2, 'sso.doc01',   'Andrea',   'Solano Brenes',   'andrea.solano@universidad.ac.cr',       1, '2026-01-05 08:10:00'), -- id 3 Docente
(2, 'sso.doc02',   'Mario',    'Rojas Arias',     'mario.rojas@universidad.ac.cr',         1, '2026-01-05 08:15:00'), -- id 4 Docente
(2, 'sso.doc03',   'Sofia',    'Vargas Mora',     'sofia.vargas@universidad.ac.cr',        1, '2026-01-05 08:20:00'), -- id 5 Docente
(3, 'sso.est01',   'Jose',     'Monge Castillo',  'jose.monge@estudiante.ac.cr',           1, '2026-01-06 08:00:00'), -- id 6 Estudiante
(3, 'sso.est02',   'Daniela',  'Quesada Fallas',  'daniela.quesada@estudiante.ac.cr',     1, '2026-01-06 08:05:00'), -- id 7 Estudiante
(3, 'sso.est03',   'Kevin',    'Araya Nunez',     'kevin.araya@estudiante.ac.cr',          1, '2026-01-06 08:10:00'), -- id 8 Estudiante
(3, 'sso.est04',   'Valeria',  'Chaves Quiroz',   'valeria.chaves@estudiante.ac.cr',       1, '2026-01-06 08:15:00'); -- id 9 Estudiante
GO

-- ============================================================
-- 5. PROGRAMAS ACADEMICOS
-- ============================================================
INSERT INTO programa_academico (codigo, nombre, nivel, activo) VALUES
('TI-001',  'Diplomado en Tecnologias de Informacion',     'Diplomado',    1), -- id 1
('ADM-001', 'Bachillerato en Administracion de Empresas',  'Bachillerato', 1), -- id 2
('ING-001', 'Bachillerato en Ingenieria de Software',      'Bachillerato', 1); -- id 3
GO

-- ============================================================
-- 6. PLANES DE ESTUDIO
-- ============================================================
INSERT INTO plan_estudio (id_programa, codigo, nombre, fecha_vigencia_inicio, fecha_vigencia_fin, activo) VALUES
(1, 'PLAN-TI-2026',  'Plan Tecnologias de Informacion 2026', '2026-01-01', NULL, 1), -- id 1
(2, 'PLAN-ADM-2026', 'Plan Administracion de Empresas 2026', '2026-01-01', NULL, 1), -- id 2
(3, 'PLAN-ING-2026', 'Plan Ingenieria de Software 2026',     '2026-01-01', NULL, 1); -- id 3
GO

-- ============================================================
-- 7. CURSOS
-- ============================================================
INSERT INTO curso (codigo, nombre, descripcion, creditos, horas_semanales, activo) VALUES
('TI101', 'Introduccion a la Programacion', 'Fundamentos de logica y programacion estructurada',       4, 5, 1), -- id 1
('TI102', 'Bases de Datos I',               'Diseno y administracion de bases de datos relacionales',  4, 5, 1), -- id 2
('TI103', 'Redes de Computadoras',          'Introduccion a redes, protocolos y seguridad basica',     3, 4, 1), -- id 3
('TI104', 'Ingenieria de Requisitos',       'Levantamiento, analisis y documentacion de requisitos',   3, 4, 1), -- id 4
('TI105', 'Programacion Web',               'Desarrollo de aplicaciones web con tecnologias modernas', 4, 5, 1), -- id 5
('ADM101','Administracion General',         'Fundamentos de administracion y gestion organizacional',  3, 4, 1), -- id 6
('ADM102','Contabilidad I',                 'Principios basicos de contabilidad financiera',           3, 4, 1), -- id 7
('ING101','Algoritmos y Estructura',        'Diseno y analisis de algoritmos computacionales',         4, 5, 1), -- id 8
('ING102','Estructuras de Datos',           'Estructuras de datos clasicas y su implementacion',       4, 5, 1), -- id 9
('ING103','Ingenieria del Software',        'Procesos, metodologias agiles y calidad de software',     4, 5, 1); -- id 10
GO

-- ============================================================
-- 8. PLAN_ESTUDIO_CURSO
-- ============================================================
INSERT INTO plan_estudio_curso (id_plan, id_curso, ciclo, obligatorio) VALUES
-- Plan TI (id_plan=1)
(1, 1, 1, 1),  -- TI101 ciclo 1
(1, 2, 2, 1),  -- TI102 ciclo 2
(1, 3, 2, 1),  -- TI103 ciclo 2
(1, 4, 3, 1),  -- TI104 ciclo 3
(1, 5, 3, 1),  -- TI105 ciclo 3
-- Plan ADM (id_plan=2)
(2, 6, 1, 1),  -- ADM101 ciclo 1
(2, 7, 1, 1),  -- ADM102 ciclo 1
-- Plan ING (id_plan=3)
(3, 1, 1, 1),  -- TI101 ciclo 1 (compartido)
(3, 8, 1, 1),  -- ING101 ciclo 1
(3, 9, 2, 1),  -- ING102 ciclo 2
(3, 10,3, 1);  -- ING103 ciclo 3
GO

-- ============================================================
-- 9. PRERREQUISITOS
-- ============================================================
INSERT INTO curso_prerrequisito (id_curso, id_curso_prerrequisito) VALUES
(2,  1),   -- TI102 requiere TI101
(5,  1),   -- TI105 requiere TI101
(9,  8),   -- ING102 requiere ING101
(10, 9);   -- ING103 requiere ING102
GO

-- ============================================================
-- 10. CORREQUISITOS
-- ============================================================
INSERT INTO curso_correquisito (id_curso, id_curso_correquisito) VALUES
(4, 2),   -- TI104 junto con TI102
(5, 2);   -- TI105 junto con TI102
GO

-- ============================================================
-- 11. PERIODOS ACADEMICOS
-- ============================================================
INSERT INTO periodo_academico (
    codigo, nombre, tipo_periodo,
    fecha_inicio, fecha_fin,
    fecha_inicio_matricula, fecha_fin_matricula,
    limite_creditos, activo
) VALUES
('2026-1', 'Primer Cuatrimestre 2026',  'Cuatrimestre', '2026-01-12', '2026-04-25', '2026-01-05', '2026-01-11', 16, 1),
('2026-2', 'Segundo Cuatrimestre 2026', 'Cuatrimestre', '2026-05-11', '2026-08-22', '2026-05-04', '2026-05-10', 16, 0);
GO

-- ============================================================
-- 12. ESTUDIANTES
--     Vinculados a usuarios con rol Estudiante (id 6-9)
-- ============================================================
INSERT INTO estudiante (
    id_usuario, carne, id_programa, estado_academico,
    fecha_ingreso, saldo_pendiente, bloqueado_financiero, bloqueado_academico
) VALUES
(6, '20260001', 1, 'Activo', '2026-01-06',  0.00,     0, 0), -- id 1  Jose   - TI    sin saldo
(7, '20260002', 1, 'Activo', '2026-01-06',  12500.00, 1, 0), -- id 2  Daniela- TI    bloqueo financiero
(8, '20260003', 3, 'Activo', '2026-01-06',  0.00,     0, 0), -- id 3  Kevin  - ING   sin saldo
(9, '20260004', 2, 'Activo', '2026-01-06',  0.00,     0, 0); -- id 4  Valeria- ADM   sin saldo
GO

-- ============================================================
-- 13. AULAS
-- ============================================================
INSERT INTO aula (codigo, nombre, edificio, capacidad, activa) VALUES
('A101', 'Laboratorio Programacion', 'Edificio A', 25, 1),
('A102', 'Aula 102',                 'Edificio A', 30, 1),
('B201', 'Laboratorio Redes',        'Edificio B', 20, 1),
('C301', 'Aula Magna 301',           'Edificio C', 40, 1);
GO

-- ============================================================
-- 14. SECCIONES (periodo 2026-1)
-- ============================================================
INSERT INTO seccion (
    id_curso, id_periodo, codigo_seccion, id_docente_usuario, id_aula,
    cupo_maximo, cupo_disponible, modalidad, estado
) VALUES
(1,  1, '01', 3, 1, 25, 23, 'Presencial', 'Abierta'),  -- id 1  TI101 secc 01
(2,  1, '01', 4, 1, 25, 24, 'Presencial', 'Abierta'),  -- id 2  TI102 secc 01
(3,  1, '01', 5, 3, 20, 20, 'Presencial', 'Abierta'),  -- id 3  TI103 secc 01 (llena)
(4,  1, '01', 3, 2, 30, 29, 'Virtual',    'Abierta'),  -- id 4  TI104 secc 01
(5,  1, '01', 4, 2, 30, 29, 'Hibrida',    'Abierta'),  -- id 5  TI105 secc 01
(8,  1, '01', 5, 1, 25, 24, 'Presencial', 'Abierta'),  -- id 6  ING101 secc 01
(9,  1, '01', 5, 1, 25, 24, 'Presencial', 'Abierta'),  -- id 7  ING102 secc 01
(10, 1, '01', 3, 4, 40, 40, 'Presencial', 'Abierta'),  -- id 8  ING103 secc 01 (llena)
(6,  1, '01', 3, 4, 40, 39, 'Presencial', 'Abierta'),  -- id 9  ADM101 secc 01
(7,  1, '01', 4, 4, 40, 40, 'Presencial', 'Abierta');  -- id 10 ADM102 secc 01 (llena)
GO

-- ============================================================
-- 15. HORARIOS DE SECCIONES
-- ============================================================
INSERT INTO horario_seccion (id_seccion, dia_semana, hora_inicio, hora_fin) VALUES
-- TI101 secc 01
(1, 'Lunes',     '08:00', '10:00'),
(1, 'Miercoles', '08:00', '10:00'),
-- TI102 secc 01
(2, 'Martes',    '10:00', '12:00'),
(2, 'Jueves',    '10:00', '12:00'),
-- TI103 secc 01
(3, 'Viernes',   '08:00', '11:00'),
-- TI104 secc 01
(4, 'Lunes',     '18:00', '20:00'),
(4, 'Miercoles', '18:00', '20:00'),
-- TI105 secc 01
(5, 'Martes',    '18:00', '20:00'),
(5, 'Jueves',    '18:00', '20:00'),
-- ING101 secc 01
(6, 'Lunes',     '13:00', '15:00'),
(6, 'Miercoles', '13:00', '15:00'),
-- ING102 secc 01
(7, 'Martes',    '13:00', '15:00'),
(7, 'Jueves',    '13:00', '15:00'),
-- ING103 secc 01
(8, 'Viernes',   '18:00', '21:00'),
-- ADM101 secc 01
(9, 'Sabado',    '08:00', '11:00'),
-- ADM102 secc 01
(10,'Sabado',    '12:00', '15:00');
GO

-- ============================================================
-- 16. MATRICULAS
-- ============================================================
INSERT INTO matricula (
    id_estudiante, id_periodo, fecha_matricula, estado,
    total_creditos, total_monto, confirmada, comprobante
) VALUES
(1, 1, '2026-01-07 09:15:00', 'Confirmada', 8,  95000.00, 1, 'CMP-2026-0001'), -- Jose:    TI101+TI102
(3, 1, '2026-01-07 10:25:00', 'Confirmada', 8, 110000.00, 1, 'CMP-2026-0002'), -- Kevin:   ING101+ING102
(4, 1, '2026-01-08 14:10:00', 'Pendiente',  3,  45000.00, 0, 'CMP-2026-0003'); -- Valeria: ADM101
GO

-- ============================================================
-- 17. DETALLE DE MATRICULAS
-- ============================================================
INSERT INTO detalle_matricula (id_matricula, id_seccion, costo, estado) VALUES
-- Matricula 1: Jose - TI
(1, 1, 45000.00, 'Matriculada'),  -- TI101
(1, 2, 50000.00, 'Matriculada'),  -- TI102
-- Matricula 2: Kevin - ING
(2, 6, 55000.00, 'Matriculada'),  -- ING101
(2, 7, 55000.00, 'Matriculada'),  -- ING102
-- Matricula 3: Valeria - ADM (reservada, pendiente de confirmar)
(3, 9, 45000.00, 'Reservada');    -- ADM101
GO

-- ============================================================
-- 18. FACTURAS
-- ============================================================
INSERT INTO factura (
    id_estudiante, id_periodo, numero_factura, fecha_emision,
    subtotal, descuentos, recargos, total, saldo, estado
) VALUES
-- id 1: Jose - pagada
(1, 1, 'FAC-2026-0001', '2026-01-07 09:20:00',  95000.00,     0.00,     0.00,  95000.00,      0.00, 'Pagada'),
-- id 2: Daniela - pendiente con recargo por mora
(2, 1, 'FAC-2026-0002', '2026-01-07 09:40:00',  85000.00,     0.00, 12500.00,  97500.00,  12500.00, 'Pendiente'),
-- id 3: Kevin - pago parcial (descuento por beca)
(3, 1, 'FAC-2026-0003', '2026-01-07 10:30:00', 110000.00, 10000.00,     0.00, 100000.00,  25000.00, 'Parcial'),
-- id 4: Valeria - pendiente total
(4, 1, 'FAC-2026-0004', '2026-01-08 14:15:00',  45000.00,     0.00,     0.00,  45000.00,  45000.00, 'Pendiente');
GO

-- ============================================================
-- 19. ESTADOS DE CUENTA
-- ============================================================
INSERT INTO estado_cuenta (
    id_estudiante, id_periodo, fecha_generacion,
    monto_total, monto_pagado, saldo_pendiente, estado
) VALUES
(1, 1, '2026-01-07 09:30:00',  95000.00,  95000.00,      0.00, 'Al dia'),
(2, 1, '2026-01-07 09:45:00',  97500.00,  85000.00,  12500.00, 'Con saldo pendiente'),
(3, 1, '2026-01-07 10:35:00', 100000.00,  75000.00,  25000.00, 'Con saldo pendiente'),
(4, 1, '2026-01-08 14:20:00',  45000.00,      0.00,  45000.00, 'Pendiente');
GO

-- ============================================================
-- 20. PAGOS
-- ============================================================
INSERT INTO pago (
    id_factura, fecha_pago, monto, metodo_pago,
    referencia_pasarela, estado, observacion
) VALUES
(1, '2026-01-07 09:25:00',  95000.00, 'Tarjeta',       'PAY-TXN-0001', 'Aprobado', 'Pago completo de matricula'),
(2, '2026-01-07 09:50:00',  85000.00, 'Transferencia', 'PAY-TXN-0002', 'Aprobado', 'Pago parcial, queda recargo pendiente'),
(3, '2026-01-07 10:40:00',  75000.00, 'SINPE',         'PAY-TXN-0003', 'Aprobado', 'Pago parcial aplicado con descuento beca');
GO

-- ============================================================
-- 21. NOTIFICACIONES
-- ============================================================
INSERT INTO notificacion (
    id_estudiante, tipo, asunto, mensaje,
    fecha_envio, medio, estado
) VALUES
(1, 'Matricula', 'Matricula confirmada',
 'Su matricula del periodo 2026-1 fue confirmada. Cursos: TI101, TI102.',
 '2026-01-07 09:16:00', 'Correo', 'Enviada'),

(1, 'Pago', 'Pago aplicado correctamente',
 'Su pago por CRC 95,000.00 fue registrado. Factura FAC-2026-0001 pagada.',
 '2026-01-07 09:26:00', 'Correo', 'Enviada'),

(2, 'Cobro', 'Saldo pendiente - accion requerida',
 'Posee un saldo pendiente de CRC 12,500.00. Regularice antes del 11/01/2026.',
 '2026-01-07 09:55:00', 'Correo', 'Enviada'),

(3, 'Pago', 'Pago parcial aplicado',
 'Se registro un pago parcial de CRC 75,000.00. Saldo restante: CRC 25,000.00.',
 '2026-01-07 10:45:00', 'Correo', 'Enviada'),

(4, 'Matricula', 'Matricula en estado pendiente',
 'Su matricula se encuentra pendiente de confirmacion. Realice su pago para confirmar.',
 '2026-01-08 14:25:00', 'Portal', 'Enviada');
GO

-- ============================================================
-- 22. BITACORA DE AUDITORIA
-- ============================================================
INSERT INTO bitacora_auditoria (
    id_usuario, entidad, accion, descripcion, fecha_evento, ip_origen
) VALUES
(1, 'usuario',           'INSERT', 'Registro inicial de 9 usuarios del sistema',         '2026-01-05 08:00:00', '192.168.1.10'),
(1, 'programa_academico','INSERT', 'Creacion de 3 programas academicos iniciales',        '2026-01-05 08:30:00', '192.168.1.10'),
(1, 'plan_estudio',      'INSERT', 'Creacion de 3 planes de estudio',                    '2026-01-05 08:45:00', '192.168.1.10'),
(1, 'curso',             'INSERT', 'Carga inicial de 10 cursos al catalogo',              '2026-01-05 09:00:00', '192.168.1.10'),
(1, 'periodo_academico', 'INSERT', 'Creacion del periodo 2026-1',                        '2026-01-05 09:30:00', '192.168.1.10'),
(1, 'seccion',           'INSERT', 'Apertura de 10 secciones para el periodo 2026-1',    '2026-01-05 10:00:00', '192.168.1.10'),
(6, 'matricula',         'INSERT', 'Jose Monge creo matricula para el periodo 2026-1',   '2026-01-07 09:15:00', '10.0.0.21'),
(6, 'factura',           'INSERT', 'Factura FAC-2026-0001 emitida automaticamente',      '2026-01-07 09:20:00', '10.0.0.21'),
(6, 'pago',              'INSERT', 'Jose Monge realizo pago completo FAC-2026-0001',     '2026-01-07 09:25:00', '10.0.0.21'),
(7, 'matricula',         'INSERT', 'Daniela Quesada inicio proceso de matricula',        '2026-01-07 09:35:00', '10.0.0.22'),
(2, 'factura',           'UPDATE', 'Recargo aplicado a FAC-2026-0002 por mora',          '2026-01-07 09:55:00', '192.168.1.15'),
(7, 'estudiante',        'UPDATE', 'Bloqueo financiero activado para Daniela Quesada',  '2026-01-07 09:56:00', '192.168.1.15'),
(8, 'matricula',         'INSERT', 'Kevin Araya creo matricula para el periodo 2026-1', '2026-01-07 10:25:00', '10.0.0.23'),
(2, 'pago',              'INSERT', 'Pago parcial registrado en FAC-2026-0003',           '2026-01-07 10:40:00', '192.168.1.15'),
(9, 'matricula',         'INSERT', 'Valeria Chaves inicio matricula pendiente',          '2026-01-08 14:10:00', '10.0.0.24'),
(1, 'seccion',           'UPDATE', 'Cupos actualizados tras cierre de matricula dia 1',  '2026-01-08 17:00:00', '192.168.1.10');
GO

-- ============================================================
-- CONSULTAS DE VALIDACION
-- ============================================================

-- Usuarios con su rol
SELECT u.id_usuario, u.nombre + ' ' + u.apellido AS nombre_completo,
       r.nombre AS rol, u.correo, u.activo
FROM usuario u
INNER JOIN rol r ON u.id_rol = r.id_rol
ORDER BY r.nombre, u.apellido;

-- Estudiantes con programa y estado financiero
SELECT e.id_estudiante, e.carne,
       u.nombre + ' ' + u.apellido AS estudiante,
       p.nombre AS programa,
       e.estado_academico,
       e.saldo_pendiente,
       CASE e.bloqueado_financiero WHEN 1 THEN 'SI' ELSE 'NO' END AS bloq_financiero
FROM estudiante e
INNER JOIN usuario u ON e.id_usuario = u.id_usuario
INNER JOIN programa_academico p ON e.id_programa = p.id_programa
ORDER BY e.carne;

-- Secciones del periodo 2026-1 con disponibilidad
SELECT c.codigo, c.nombre AS curso, s.codigo_seccion,
       u.nombre + ' ' + u.apellido AS docente,
       a.nombre AS aula, s.modalidad,
       s.cupo_maximo, s.cupo_disponible, s.estado
FROM seccion s
INNER JOIN curso c  ON s.id_curso = c.id_curso
INNER JOIN periodo_academico pa ON s.id_periodo = pa.id_periodo
LEFT  JOIN usuario u ON s.id_docente_usuario = u.id_usuario
LEFT  JOIN aula a    ON s.id_aula = a.id_aula
WHERE pa.codigo = '2026-1'
ORDER BY c.codigo;

-- Resumen financiero por estudiante
SELECT u.nombre + ' ' + u.apellido AS estudiante,
       f.numero_factura, f.total, f.saldo, f.estado AS estado_factura,
       ISNULL(SUM(p.monto), 0) AS total_pagado
FROM factura f
INNER JOIN estudiante e ON f.id_estudiante = e.id_estudiante
INNER JOIN usuario u    ON e.id_usuario = u.id_usuario
LEFT  JOIN pago p       ON f.id_factura = p.id_factura AND p.estado = 'Aprobado'
GROUP BY u.nombre, u.apellido, f.numero_factura, f.total, f.saldo, f.estado
ORDER BY f.numero_factura;
GO
