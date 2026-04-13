USE SistemaMatriculaUniversitaria;
GO

/* =========================================================
   DATOS DE PRUEBA - SISTEMA DE MATRICULA UNIVERSITARIA
   ========================================================= */

/* =========================
   1. ROLES
   ========================= */
INSERT INTO rol (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Docente', 'Gestión académica y consulta de secciones'),
('Estudiante', 'Proceso de matrícula y consulta de estado de cuenta'),
('Finanzas', 'Gestión de facturas, pagos y estados de cuenta');
GO

/* =========================
   2. PERMISOS
   ========================= */
INSERT INTO permiso (nombre, descripcion) VALUES
('GESTION_USUARIOS', 'Permite crear, modificar y consultar usuarios'),
('GESTION_ROLES', 'Permite administrar roles y permisos'),
('GESTION_PROGRAMAS', 'Permite administrar programas académicos'),
('GESTION_PLANES', 'Permite administrar planes de estudio'),
('GESTION_CURSOS', 'Permite administrar cursos'),
('GESTION_SECCIONES', 'Permite administrar secciones y horarios'),
('MATRICULAR_CURSOS', 'Permite realizar matrícula'),
('CONSULTAR_ESTADO_CUENTA', 'Permite ver estado de cuenta'),
('REGISTRAR_PAGOS', 'Permite registrar pagos'),
('GENERAR_FACTURAS', 'Permite generar facturas'),
('CONSULTAR_AUDITORIA', 'Permite consultar bitácora');
GO

/* =========================
   3. ROL_PERMISO
   ========================= */
-- Administrador
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT 1, id_permiso FROM permiso;

-- Docente
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
(2, 5),
(2, 6);

-- Estudiante
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
(3, 7),
(3, 8);

-- Finanzas
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
(4, 8),
(4, 9),
(4, 10);
GO

/* =========================
   4. USUARIOS
   ========================= */
INSERT INTO usuario (id_rol, identificador_sso, nombre, apellido, correo, activo, fecha_creacion) VALUES
(1, 'sso.admin01', 'Laura', 'Mora', 'laura.mora@universidad.ac.cr', 1, GETDATE()),
(4, 'sso.fin01', 'Carlos', 'Jimenez', 'carlos.jimenez@universidad.ac.cr', 1, GETDATE()),
(2, 'sso.doc01', 'Andrea', 'Solano', 'andrea.solano@universidad.ac.cr', 1, GETDATE()),
(2, 'sso.doc02', 'Mario', 'Rojas', 'mario.rojas@universidad.ac.cr', 1, GETDATE()),
(2, 'sso.doc03', 'Sofia', 'Vargas', 'sofia.vargas@universidad.ac.cr', 1, GETDATE()),
(3, 'sso.est01', 'Jose', 'Monge', 'jose.monge@estudiante.ac.cr', 1, GETDATE()),
(3, 'sso.est02', 'Daniela', 'Quesada', 'daniela.quesada@estudiante.ac.cr', 1, GETDATE()),
(3, 'sso.est03', 'Kevin', 'Araya', 'kevin.araya@estudiante.ac.cr', 1, GETDATE()),
(3, 'sso.est04', 'Valeria', 'Chaves', 'valeria.chaves@estudiante.ac.cr', 1, GETDATE());
GO

/* =========================
   5. PROGRAMA_ACADEMICO
   ========================= */
INSERT INTO programa_academico (codigo, nombre, nivel, activo) VALUES
('TI-001', 'Diplomado en Tecnologías de Información', 'Diplomado', 1),
('ADM-001', 'Bachillerato en Administración de Empresas', 'Bachillerato', 1),
('ING-001', 'Bachillerato en Ingeniería de Software', 'Bachillerato', 1);
GO

/* =========================
   6. PLAN_ESTUDIO
   ========================= */
INSERT INTO plan_estudio (id_programa, codigo, nombre, fecha_vigencia_inicio, fecha_vigencia_fin, activo) VALUES
(1, 'PLAN-TI-2026', 'Plan TI 2026', '2026-01-01', NULL, 1),
(2, 'PLAN-ADM-2026', 'Plan Administración 2026', '2026-01-01', NULL, 1),
(3, 'PLAN-ING-2026', 'Plan Ingeniería 2026', '2026-01-01', NULL, 1);
GO

/* =========================
   7. CURSOS
   ========================= */
INSERT INTO curso (codigo, nombre, descripcion, creditos, horas_semanales, activo) VALUES
('TI101', 'Introducción a la Programación', 'Fundamentos de programación', 4, 5, 1),
('TI102', 'Bases de Datos I', 'Conceptos básicos de bases de datos', 4, 5, 1),
('TI103', 'Redes I', 'Introducción a redes de computadoras', 3, 4, 1),
('TI104', 'Ingeniería de Requisitos', 'Levantamiento y análisis de requisitos', 3, 4, 1),
('TI105', 'Programación Web', 'Desarrollo de aplicaciones web', 4, 5, 1),
('ADM101', 'Administración General', 'Fundamentos de administración', 3, 4, 1),
('ADM102', 'Contabilidad I', 'Principios básicos de contabilidad', 3, 4, 1),
('ING101', 'Algoritmos', 'Diseño y análisis de algoritmos', 4, 5, 1),
('ING102', 'Estructuras de Datos', 'Estructuras de datos fundamentales', 4, 5, 1),
('ING103', 'Ingeniería del Software', 'Procesos y metodologías de software', 4, 5, 1);
GO

/* =========================
   8. PLAN_ESTUDIO_CURSO
   ========================= */
INSERT INTO plan_estudio_curso (id_plan, id_curso, ciclo, obligatorio) VALUES
(1, 1, 1, 1),
(1, 2, 2, 1),
(1, 3, 2, 1),
(1, 4, 3, 1),
(1, 5, 3, 1),

(2, 6, 1, 1),
(2, 7, 1, 1),

(3, 8, 1, 1),
(3, 9, 2, 1),
(3, 10, 3, 1);
GO

/* =========================
   9. PRERREQUISITOS
   ========================= */
INSERT INTO curso_prerrequisito (id_curso, id_curso_prerrequisito) VALUES
(2, 1),   -- Bases de Datos I requiere Intro a Programación
(5, 1),   -- Programación Web requiere Intro a Programación
(9, 8),   -- Estructuras de Datos requiere Algoritmos
(10, 9);  -- Ingeniería del Software requiere Estructuras de Datos
GO

/* =========================
   10. CORREQUISITOS
   ========================= */
INSERT INTO curso_correquisito (id_curso, id_curso_correquisito) VALUES
(4, 2),   -- Ingeniería de Requisitos con Bases de Datos I
(5, 2);   -- Programación Web con Bases de Datos I
GO

/* =========================
   11. PERIODOS_ACADEMICOS
   ========================= */
INSERT INTO periodo_academico (
    codigo, nombre, tipo_periodo,
    fecha_inicio, fecha_fin,
    fecha_inicio_matricula, fecha_fin_matricula,
    limite_creditos, activo
) VALUES
('2026-1', 'Primer Cuatrimestre 2026', 'Cuatrimestre', '2026-01-12', '2026-04-25', '2026-01-05', '2026-01-11', 16, 1),
('2026-2', 'Segundo Cuatrimestre 2026', 'Cuatrimestre', '2026-05-11', '2026-08-22', '2026-05-04', '2026-05-10', 16, 1);
GO

/* =========================
   12. ESTUDIANTES
   ========================= */
INSERT INTO estudiante (
    id_usuario, carne, id_programa, estado_academico,
    fecha_ingreso, saldo_pendiente, bloqueado_financiero, bloqueado_academico
) VALUES
(6, '20260001', 1, 'Activo', '2026-01-06', 0.00, 0, 0),
(7, '20260002', 1, 'Activo', '2026-01-06', 12500.00, 1, 0),
(8, '20260003', 3, 'Activo', '2026-01-06', 0.00, 0, 0),
(9, '20260004', 2, 'Activo', '2026-01-06', 0.00, 0, 0);
GO

/* =========================
   13. AULAS
   ========================= */
INSERT INTO aula (codigo, nombre, edificio, capacidad, activa) VALUES
('A101', 'Laboratorio 1', 'Edificio A', 25, 1),
('A102', 'Aula 102', 'Edificio A', 30, 1),
('B201', 'Laboratorio Redes', 'Edificio B', 20, 1),
('C301', 'Aula Magna 301', 'Edificio C', 40, 1);
GO

/* =========================
   14. SECCIONES
   ========================= */
INSERT INTO seccion (
    id_curso, id_periodo, codigo_seccion, id_docente_usuario, id_aula,
    cupo_maximo, cupo_disponible, modalidad, estado
) VALUES
(1, 1, '01', 3, 1, 25, 23, 'Presencial', 'Abierta'),
(2, 1, '01', 4, 1, 25, 24, 'Presencial', 'Abierta'),
(3, 1, '01', 5, 3, 20, 20, 'Presencial', 'Abierta'),
(4, 1, '01', 3, 2, 30, 29, 'Virtual', 'Abierta'),
(5, 1, '01', 4, 2, 30, 29, 'Híbrida', 'Abierta'),
(8, 1, '01', 5, 1, 25, 24, 'Presencial', 'Abierta'),
(9, 1, '01', 5, 1, 25, 24, 'Presencial', 'Abierta'),
(10, 1, '01', 3, 4, 40, 40, 'Presencial', 'Abierta'),
(6, 1, '01', 3, 4, 40, 39, 'Presencial', 'Abierta'),
(7, 1, '01', 4, 4, 40, 40, 'Presencial', 'Abierta');
GO

/* =========================
   15. HORARIOS_SECCION
   ========================= */
INSERT INTO horario_seccion (id_seccion, dia_semana, hora_inicio, hora_fin) VALUES
(1, 'Lunes', '08:00', '10:00'),
(1, 'Miércoles', '08:00', '10:00'),

(2, 'Martes', '10:00', '12:00'),
(2, 'Jueves', '10:00', '12:00'),

(3, 'Viernes', '08:00', '11:00'),

(4, 'Lunes', '18:00', '20:00'),
(4, 'Miércoles', '18:00', '20:00'),

(5, 'Martes', '18:00', '20:00'),
(5, 'Jueves', '18:00', '20:00'),

(6, 'Lunes', '13:00', '15:00'),
(6, 'Miércoles', '13:00', '15:00'),

(7, 'Martes', '13:00', '15:00'),
(7, 'Jueves', '13:00', '15:00'),

(8, 'Viernes', '18:00', '21:00'),

(9, 'Sábado', '08:00', '11:00'),
(10, 'Sábado', '12:00', '15:00');
GO

/* =========================
   16. MATRICULA
   ========================= */
INSERT INTO matricula (
    id_estudiante, id_periodo, fecha_matricula, estado,
    total_creditos, total_monto, confirmada, comprobante
) VALUES
(1, 1, '2026-01-07 09:15:00', 'Confirmada', 8, 95000.00, 1, 'CMP-2026-0001'),
(3, 1, '2026-01-07 10:25:00', 'Confirmada', 8, 110000.00, 1, 'CMP-2026-0002'),
(4, 1, '2026-01-08 14:10:00', 'Pendiente', 3, 45000.00, 0, 'CMP-2026-0003');
GO

/* =========================
   17. DETALLE_MATRICULA
   ========================= */
INSERT INTO detalle_matricula (id_matricula, id_seccion, costo, estado) VALUES
(1, 1, 45000.00, 'Matriculada'),
(1, 2, 50000.00, 'Matriculada'),

(2, 6, 55000.00, 'Matriculada'),
(2, 7, 55000.00, 'Matriculada'),

(3, 9, 45000.00, 'Reservada');
GO

/* =========================
   18. FACTURA
   ========================= */
INSERT INTO factura (
    id_estudiante, id_periodo, numero_factura, fecha_emision,
    subtotal, descuentos, recargos, total, saldo, estado
) VALUES
(1, 1, 'FAC-2026-0001', '2026-01-07 09:20:00', 95000.00, 0.00, 0.00, 95000.00, 0.00, 'Pagada'),
(2, 1, 'FAC-2026-0002', '2026-01-07 09:40:00', 85000.00, 0.00, 12500.00, 97500.00, 12500.00, 'Pendiente'),
(3, 1, 'FAC-2026-0003', '2026-01-07 10:30:00', 110000.00, 10000.00, 0.00, 100000.00, 25000.00, 'Parcial'),
(4, 1, 'FAC-2026-0004', '2026-01-08 14:15:00', 45000.00, 0.00, 0.00, 45000.00, 45000.00, 'Pendiente');
GO

/* =========================
   19. ESTADO_CUENTA
   ========================= */
INSERT INTO estado_cuenta (
    id_estudiante, id_periodo, fecha_generacion,
    monto_total, monto_pagado, saldo_pendiente, estado
) VALUES
(1, 1, '2026-01-07 09:30:00', 95000.00, 95000.00, 0.00, 'Al día'),
(2, 1, '2026-01-07 09:45:00', 97500.00, 85000.00, 12500.00, 'Con saldo pendiente'),
(3, 1, '2026-01-07 10:35:00', 100000.00, 75000.00, 25000.00, 'Con saldo pendiente'),
(4, 1, '2026-01-08 14:20:00', 45000.00, 0.00, 45000.00, 'Pendiente');
GO

/* =========================
   20. PAGOS
   ========================= */
INSERT INTO pago (
    id_factura, fecha_pago, monto, metodo_pago,
    referencia_pasarela, estado, observacion
) VALUES
(1, '2026-01-07 09:25:00', 95000.00, 'Tarjeta', 'PAY-0001', 'Aprobado', 'Pago completo de matrícula'),
(2, '2026-01-07 09:50:00', 85000.00, 'Transferencia', 'PAY-0002', 'Aprobado', 'Pago parcial, queda recargo pendiente'),
(3, '2026-01-07 10:40:00', 75000.00, 'SINPE', 'PAY-0003', 'Aprobado', 'Pago parcial aplicado');
GO

/* =========================
   21. NOTIFICACIONES
   ========================= */
INSERT INTO notificacion (
    id_estudiante, tipo, asunto, mensaje,
    fecha_envio, medio, estado
) VALUES
(1, 'Matrícula', 'Matrícula confirmada', 'Su matrícula del periodo 2026-1 fue confirmada correctamente.', '2026-01-07 09:16:00', 'Correo', 'Enviada'),
(1, 'Pago', 'Pago aplicado', 'Su pago fue registrado exitosamente.', '2026-01-07 09:26:00', 'Correo', 'Enviada'),
(2, 'Cobro', 'Saldo pendiente', 'Posee un saldo pendiente de 12,500.00 colones.', '2026-01-07 09:55:00', 'Correo', 'Enviada'),
(3, 'Pago', 'Pago parcial aplicado', 'Se registró un pago parcial. Revise su estado de cuenta.', '2026-01-07 10:45:00', 'Correo', 'Enviada'),
(4, 'Matrícula', 'Matrícula pendiente', 'Su matrícula se encuentra en estado pendiente de confirmación.', '2026-01-08 14:25:00', 'Correo', 'Enviada');
GO

/* =========================
   22. BITACORA_AUDITORIA
   ========================= */
INSERT INTO bitacora_auditoria (
    id_usuario, entidad, accion, descripcion, fecha_evento, ip_origen
) VALUES
(1, 'usuario', 'INSERT', 'Registro inicial de usuarios del sistema', '2026-01-05 08:00:00', '192.168.1.10'),
(1, 'programa_academico', 'INSERT', 'Creación de programas académicos iniciales', '2026-01-05 08:30:00', '192.168.1.10'),
(1, 'curso', 'INSERT', 'Carga inicial de cursos', '2026-01-05 09:00:00', '192.168.1.10'),
(6, 'matricula', 'INSERT', 'Matrícula creada para el periodo 2026-1', '2026-01-07 09:15:00', '10.0.0.21'),
(7, 'factura', 'UPDATE', 'Factura con saldo pendiente por recargo', '2026-01-07 09:55:00', '10.0.0.22'),
(2, 'pago', 'INSERT', 'Registro de pago parcial', '2026-01-07 10:40:00', '192.168.1.15');
GO

/* =========================================================
   CONSULTAS DE VALIDACION OPCIONALES
   ========================================================= */

-- Ver usuarios
SELECT * FROM usuario;

-- Ver estudiantes con programa
SELECT 
    e.id_estudiante,
    e.carne,
    u.nombre,
    u.apellido,
    p.nombre AS programa
FROM estudiante e
INNER JOIN usuario u ON e.id_usuario = u.id_usuario
INNER JOIN programa_academico p ON e.id_programa = p.id_programa;

-- Ver secciones con curso, docente y aula
SELECT
    s.id_seccion,
    c.nombre AS curso,
    s.codigo_seccion,
    u.nombre + ' ' + u.apellido AS docente,
    a.nombre AS aula,
    s.cupo_maximo,
    s.cupo_disponible
FROM seccion s
INNER JOIN curso c ON s.id_curso = c.id_curso
LEFT JOIN usuario u ON s.id_docente_usuario = u.id_usuario
LEFT JOIN aula a ON s.id_aula = a.id_aula;

-- Ver facturas y pagos
SELECT
    f.numero_factura,
    f.total,
    f.saldo,
    f.estado,
    p.monto,
    p.metodo_pago
FROM factura f
LEFT JOIN pago p ON f.id_factura = p.id_factura
ORDER BY f.id_factura;
GO