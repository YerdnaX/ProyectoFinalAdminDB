-- ============================================================
-- SISTEMA DE MATRICULA UNIVERSITARIA
-- Script de creacion de estructura (alineado al codigo fuente)
-- Motor: SQL Server
-- Requiere ejecutar dentro de una base de datos ya creada
-- ============================================================

SET NOCOUNT ON;
GO

IF DB_NAME() IS NULL OR DB_NAME() = 'master'
BEGIN
    RAISERROR('Seleccione primero la base de datos destino y luego ejecute este script.', 16, 1);
    RETURN;
END
GO

-- ============================================================
-- LIMPIEZA ESTRUCTURAL
-- Elimina objetos dentro de la base de datos actualmente seleccionada
-- para garantizar una creacion limpia.
-- ============================================================
DROP TABLE IF EXISTS rol_permiso;
DROP TABLE IF EXISTS curso_correquisito;
DROP TABLE IF EXISTS curso_prerrequisito;
DROP TABLE IF EXISTS plan_estudio_curso;
DROP TABLE IF EXISTS horario_seccion;
DROP TABLE IF EXISTS detalle_matricula;
DROP TABLE IF EXISTS pago;
DROP TABLE IF EXISTS factura;
DROP TABLE IF EXISTS estado_cuenta;
DROP TABLE IF EXISTS notificacion;
DROP TABLE IF EXISTS matricula;
DROP TABLE IF EXISTS seccion;
DROP TABLE IF EXISTS aula;
DROP TABLE IF EXISTS estudiante;
DROP TABLE IF EXISTS curso;
DROP TABLE IF EXISTS plan_estudio;
DROP TABLE IF EXISTS periodo_academico;
DROP TABLE IF EXISTS programa_academico;
DROP TABLE IF EXISTS bitacora_auditoria;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS permiso;
DROP TABLE IF EXISTS rol;
GO

-- ============================================================
-- 1. SEGURIDAD Y USUARIOS
-- ============================================================

CREATE TABLE rol (
    id_rol      INT          IDENTITY(1,1) PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion VARCHAR(200) NULL
);
GO

CREATE TABLE permiso (
    id_permiso  INT           IDENTITY(1,1) PRIMARY KEY,
    nombre      VARCHAR(100)  NOT NULL UNIQUE,
    descripcion VARCHAR(200)  NULL
);
GO

CREATE TABLE rol_permiso (
    id_rol     INT NOT NULL,
    id_permiso INT NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    CONSTRAINT FK_rol_permiso_rol     FOREIGN KEY (id_rol)     REFERENCES rol(id_rol),
    CONSTRAINT FK_rol_permiso_permiso FOREIGN KEY (id_permiso) REFERENCES permiso(id_permiso)
);
GO

CREATE TABLE usuario (
    id_usuario        INT           IDENTITY(1,1) PRIMARY KEY,
    id_rol            INT           NOT NULL,
    identificador_sso VARCHAR(100)  NOT NULL UNIQUE,
    nombre            VARCHAR(100)  NOT NULL,
    apellido          VARCHAR(100)  NOT NULL,
    correo            VARCHAR(150)  NOT NULL UNIQUE,
    clave_hash        VARCHAR(255)  NULL,
    activo            BIT           NOT NULL DEFAULT 1,
    fecha_creacion    DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);
GO

CREATE TABLE bitacora_auditoria (
    id_bitacora   BIGINT        IDENTITY(1,1) PRIMARY KEY,
    id_usuario    INT           NULL,
    entidad       VARCHAR(100)  NOT NULL,
    accion        VARCHAR(50)   NOT NULL,
    descripcion   VARCHAR(500)  NULL,
    fecha_evento  DATETIME      NOT NULL DEFAULT GETDATE(),
    ip_origen     VARCHAR(50)   NULL,
    CONSTRAINT FK_bitacora_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT CHK_bitacora_accion CHECK (UPPER(accion) IN ('INSERT','UPDATE','DELETE','SELECT','LOGIN','LOGOUT'))
);
GO

-- ============================================================
-- 2. ESTRUCTURA ACADEMICA
-- ============================================================

CREATE TABLE programa_academico (
    id_programa INT           IDENTITY(1,1) PRIMARY KEY,
    codigo      VARCHAR(20)   NOT NULL UNIQUE,
    nombre      VARCHAR(150)  NOT NULL,
    nivel       VARCHAR(50)   NULL,
    activo      BIT           NOT NULL DEFAULT 1,
    CONSTRAINT CHK_programa_nivel CHECK (nivel IN ('Tecnico','Diplomado','Bachillerato','Licenciatura','Maestria','Doctorado'))
);
GO

CREATE TABLE plan_estudio (
    id_plan               INT           IDENTITY(1,1) PRIMARY KEY,
    id_programa           INT           NOT NULL,
    codigo                VARCHAR(20)   NOT NULL UNIQUE,
    nombre                VARCHAR(150)  NOT NULL,
    fecha_vigencia_inicio DATE          NOT NULL,
    fecha_vigencia_fin    DATE          NULL,
    activo                BIT           NOT NULL DEFAULT 1,
    CONSTRAINT FK_plan_estudio_programa FOREIGN KEY (id_programa) REFERENCES programa_academico(id_programa),
    CONSTRAINT CHK_plan_fechas CHECK (fecha_vigencia_fin IS NULL OR fecha_vigencia_fin > fecha_vigencia_inicio)
);
GO

CREATE TABLE curso (
    id_curso        INT           IDENTITY(1,1) PRIMARY KEY,
    codigo          VARCHAR(20)   NOT NULL UNIQUE,
    nombre          VARCHAR(150)  NOT NULL,
    descripcion     VARCHAR(300)  NULL,
    creditos        INT           NOT NULL,
    horas_semanales INT           NULL,
    activo          BIT           NOT NULL DEFAULT 1,
    CONSTRAINT CHK_curso_creditos        CHECK (creditos > 0),
    CONSTRAINT CHK_curso_horas_semanales CHECK (horas_semanales IS NULL OR horas_semanales > 0)
);
GO

CREATE TABLE plan_estudio_curso (
    id_plan_curso INT  IDENTITY(1,1) PRIMARY KEY,
    id_plan       INT  NOT NULL,
    id_curso      INT  NOT NULL,
    ciclo         INT  NULL,
    obligatorio   BIT  NOT NULL DEFAULT 1,
    CONSTRAINT UQ_plan_curso                 UNIQUE (id_plan, id_curso),
    CONSTRAINT UQ_plan_curso_unico_por_curso UNIQUE (id_curso),
    CONSTRAINT FK_plan_estudio_curso_plan    FOREIGN KEY (id_plan)  REFERENCES plan_estudio(id_plan),
    CONSTRAINT FK_plan_estudio_curso_curso   FOREIGN KEY (id_curso) REFERENCES curso(id_curso),
    CONSTRAINT CHK_plan_estudio_curso_ciclo  CHECK (ciclo IS NULL OR ciclo > 0)
);
GO

CREATE TABLE curso_prerrequisito (
    id_curso               INT NOT NULL,
    id_curso_prerrequisito INT NOT NULL,
    PRIMARY KEY (id_curso, id_curso_prerrequisito),
    CONSTRAINT FK_prerreq_curso FOREIGN KEY (id_curso) REFERENCES curso(id_curso),
    CONSTRAINT FK_prerreq_req   FOREIGN KEY (id_curso_prerrequisito) REFERENCES curso(id_curso),
    CONSTRAINT CHK_prerreq_diferente CHECK (id_curso <> id_curso_prerrequisito)
);
GO

CREATE TABLE curso_correquisito (
    id_curso               INT NOT NULL,
    id_curso_correquisito  INT NOT NULL,
    PRIMARY KEY (id_curso, id_curso_correquisito),
    CONSTRAINT FK_correq_curso FOREIGN KEY (id_curso) REFERENCES curso(id_curso),
    CONSTRAINT FK_correq_req   FOREIGN KEY (id_curso_correquisito) REFERENCES curso(id_curso),
    CONSTRAINT CHK_correq_diferente CHECK (id_curso <> id_curso_correquisito)
);
GO

-- ============================================================
-- 3. PERIODOS Y ESTUDIANTES
-- ============================================================

CREATE TABLE periodo_academico (
    id_periodo             INT           IDENTITY(1,1) PRIMARY KEY,
    codigo                 VARCHAR(20)   NOT NULL UNIQUE,
    nombre                 VARCHAR(100)  NOT NULL,
    tipo_periodo           VARCHAR(30)   NOT NULL,
    fecha_inicio           DATE          NOT NULL,
    fecha_fin              DATE          NOT NULL,
    fecha_inicio_matricula DATE          NOT NULL,
    fecha_fin_matricula    DATE          NOT NULL,
    limite_creditos        INT           NOT NULL,
    activo                 BIT           NOT NULL DEFAULT 1,
    CONSTRAINT CHK_periodo_tipo CHECK (tipo_periodo IN ('Semestre','Cuatrimestre','Trimestre')),
    CONSTRAINT CHK_periodo_fechas CHECK (fecha_fin > fecha_inicio),
    CONSTRAINT CHK_periodo_mat CHECK (fecha_fin_matricula >= fecha_inicio_matricula),
    CONSTRAINT CHK_periodo_creditos CHECK (limite_creditos > 0)
);
GO

CREATE TABLE estudiante (
    id_estudiante         INT            IDENTITY(1,1) PRIMARY KEY,
    id_usuario            INT            NOT NULL UNIQUE,
    carne                 VARCHAR(20)    NOT NULL UNIQUE,
    id_programa           INT            NOT NULL,
    estado_academico      VARCHAR(50)    NOT NULL DEFAULT 'Activo',
    fecha_ingreso         DATE           NOT NULL,
    saldo_pendiente       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    bloqueado_financiero  BIT            NOT NULL DEFAULT 0,
    bloqueado_academico   BIT            NOT NULL DEFAULT 0,
    CONSTRAINT FK_estudiante_usuario  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT FK_estudiante_programa FOREIGN KEY (id_programa) REFERENCES programa_academico(id_programa),
    CONSTRAINT CHK_estudiante_estado CHECK (estado_academico IN ('Activo','Inactivo','Graduado','Suspendido')),
    CONSTRAINT CHK_estudiante_saldo CHECK (saldo_pendiente >= 0)
);
GO

-- ============================================================
-- 4. OFERTA ACADEMICA
-- ============================================================

CREATE TABLE aula (
    id_aula    INT           IDENTITY(1,1) PRIMARY KEY,
    codigo     VARCHAR(20)   NOT NULL UNIQUE,
    nombre     VARCHAR(100)  NOT NULL,
    edificio   VARCHAR(100)  NULL,
    capacidad  INT           NOT NULL,
    activa     BIT           NOT NULL DEFAULT 1,
    CONSTRAINT CHK_aula_capacidad CHECK (capacidad > 0)
);
GO

CREATE TABLE seccion (
    id_seccion         INT           IDENTITY(1,1) PRIMARY KEY,
    id_curso           INT           NOT NULL,
    id_periodo         INT           NOT NULL,
    codigo_seccion     VARCHAR(20)   NOT NULL,
    id_docente_usuario INT           NULL,
    id_aula            INT           NULL,
    cupo_maximo        INT           NOT NULL,
    cupo_disponible    INT           NOT NULL,
    modalidad          VARCHAR(30)   NULL,
    estado             VARCHAR(30)   NOT NULL DEFAULT 'Abierta',
    CONSTRAINT UQ_seccion UNIQUE (id_curso, id_periodo, codigo_seccion),
    CONSTRAINT FK_seccion_curso FOREIGN KEY (id_curso) REFERENCES curso(id_curso),
    CONSTRAINT FK_seccion_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo),
    CONSTRAINT FK_seccion_docente FOREIGN KEY (id_docente_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT FK_seccion_aula FOREIGN KEY (id_aula) REFERENCES aula(id_aula),
    CONSTRAINT CHK_seccion_cupos CHECK (cupo_maximo > 0 AND cupo_disponible >= 0 AND cupo_disponible <= cupo_maximo),
    CONSTRAINT CHK_seccion_estado CHECK (estado IN ('Abierta','Cerrada','Cancelada')),
    CONSTRAINT CHK_seccion_modalidad CHECK (modalidad IS NULL OR modalidad IN ('Presencial','Virtual','Hibrida'))
);
GO

CREATE TABLE horario_seccion (
    id_horario   INT          IDENTITY(1,1) PRIMARY KEY,
    id_seccion   INT          NOT NULL,
    dia_semana   VARCHAR(15)  NOT NULL,
    hora_inicio  TIME         NOT NULL,
    hora_fin     TIME         NOT NULL,
    CONSTRAINT FK_horario_seccion FOREIGN KEY (id_seccion) REFERENCES seccion(id_seccion),
    CONSTRAINT UQ_horario_unique UNIQUE (id_seccion, dia_semana, hora_inicio, hora_fin),
    CONSTRAINT CHK_horario_dia CHECK (dia_semana IN ('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo')),
    CONSTRAINT CHK_horario_rango CHECK (hora_inicio < hora_fin)
);
GO

-- ============================================================
-- 5. MATRICULA
-- ============================================================

CREATE TABLE matricula (
    id_matricula      INT            IDENTITY(1,1) PRIMARY KEY,
    id_estudiante     INT            NOT NULL,
    id_periodo        INT            NOT NULL,
    fecha_matricula   DATETIME       NOT NULL DEFAULT GETDATE(),
    estado            VARCHAR(30)    NOT NULL DEFAULT 'Pendiente',
    total_creditos    INT            NOT NULL DEFAULT 0,
    total_monto       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    confirmada        BIT            NOT NULL DEFAULT 0,
    comprobante       VARCHAR(100)   NULL,
    CONSTRAINT UQ_matricula_est_periodo UNIQUE (id_estudiante, id_periodo),
    CONSTRAINT FK_matricula_estudiante FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    CONSTRAINT FK_matricula_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo),
    CONSTRAINT CHK_matricula_estado CHECK (estado IN ('Pendiente','En proceso','Confirmada','Cancelada')),
    CONSTRAINT CHK_matricula_creditos CHECK (total_creditos >= 0),
    CONSTRAINT CHK_matricula_monto CHECK (total_monto >= 0)
);
GO

CREATE TABLE detalle_matricula (
    id_detalle_matricula INT            IDENTITY(1,1) PRIMARY KEY,
    id_matricula         INT            NOT NULL,
    id_seccion           INT            NOT NULL,
    costo                DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    estado               VARCHAR(30)    NOT NULL DEFAULT 'Matriculada',
    CONSTRAINT UQ_detalle_matricula UNIQUE (id_matricula, id_seccion),
    CONSTRAINT FK_detalle_matricula_matricula FOREIGN KEY (id_matricula) REFERENCES matricula(id_matricula),
    CONSTRAINT FK_detalle_matricula_seccion FOREIGN KEY (id_seccion) REFERENCES seccion(id_seccion),
    CONSTRAINT CHK_detalle_matricula_costo CHECK (costo >= 0),
    CONSTRAINT CHK_detalle_matricula_estado CHECK (estado IN ('Matriculada','Reservada','Retirada','Anulada'))
);
GO

-- ============================================================
-- 6. FACTURACION Y PAGOS
-- ============================================================

CREATE TABLE factura (
    id_factura      INT            IDENTITY(1,1) PRIMARY KEY,
    id_estudiante   INT            NOT NULL,
    id_periodo      INT            NOT NULL,
    numero_factura  VARCHAR(30)    NOT NULL UNIQUE,
    fecha_emision   DATETIME       NOT NULL DEFAULT GETDATE(),
    subtotal        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    descuentos      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    recargos        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    total           DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    saldo           DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    estado          VARCHAR(30)    NOT NULL DEFAULT 'Pendiente',
    CONSTRAINT FK_factura_estudiante FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    CONSTRAINT FK_factura_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo),
    CONSTRAINT CHK_factura_montos CHECK (subtotal >= 0 AND descuentos >= 0 AND recargos >= 0 AND total >= 0 AND saldo >= 0),
    CONSTRAINT CHK_factura_estado CHECK (estado IN ('Pendiente','Parcial','Pagada','Anulada'))
);
GO

CREATE TABLE pago (
    id_pago              INT            IDENTITY(1,1) PRIMARY KEY,
    id_factura           INT            NOT NULL,
    fecha_pago           DATETIME       NOT NULL DEFAULT GETDATE(),
    monto                DECIMAL(10,2)  NOT NULL,
    metodo_pago          VARCHAR(50)    NOT NULL,
    referencia_pasarela  VARCHAR(100)   NULL,
    estado               VARCHAR(30)    NOT NULL DEFAULT 'Aprobado',
    observacion          VARCHAR(300)   NULL,
    CONSTRAINT FK_pago_factura FOREIGN KEY (id_factura) REFERENCES factura(id_factura),
    CONSTRAINT CHK_pago_monto CHECK (monto > 0),
    CONSTRAINT CHK_pago_metodo CHECK (metodo_pago IN ('Tarjeta','Transferencia','SINPE','Efectivo')),
    CONSTRAINT CHK_pago_estado CHECK (estado IN ('Aprobado','Rechazado','Pendiente','Reversado'))
);
GO

CREATE TABLE estado_cuenta (
    id_estado_cuenta INT            IDENTITY(1,1) PRIMARY KEY,
    id_estudiante    INT            NOT NULL,
    id_periodo       INT            NOT NULL,
    fecha_generacion DATETIME       NOT NULL DEFAULT GETDATE(),
    monto_total      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    monto_pagado     DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    saldo_pendiente  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    estado           VARCHAR(50)    NOT NULL,
    CONSTRAINT UQ_estado_cuenta UNIQUE (id_estudiante, id_periodo),
    CONSTRAINT FK_estado_cuenta_estudiante FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    CONSTRAINT FK_estado_cuenta_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo),
    CONSTRAINT CHK_estado_cuenta_montos CHECK (monto_total >= 0 AND monto_pagado >= 0 AND saldo_pendiente >= 0),
    CONSTRAINT CHK_estado_cuenta_estado CHECK (estado IN ('Al dia','Con saldo pendiente','Pendiente','Bloqueado','Parcial'))
);
GO

-- ============================================================
-- 7. NOTIFICACIONES
-- ============================================================

CREATE TABLE notificacion (
    id_notificacion  INT           IDENTITY(1,1) PRIMARY KEY,
    id_estudiante    INT           NOT NULL,
    tipo             VARCHAR(30)   NOT NULL,
    asunto           VARCHAR(150)  NOT NULL,
    mensaje          VARCHAR(500)  NOT NULL,
    fecha_envio      DATETIME      NOT NULL DEFAULT GETDATE(),
    medio            VARCHAR(30)   NOT NULL,
    estado           VARCHAR(30)   NOT NULL DEFAULT 'Enviada',
    CONSTRAINT FK_notificacion_estudiante FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    CONSTRAINT CHK_notificacion_tipo CHECK (tipo IN ('Matricula','Pago','Cobro','Academico','Sistema')),
    CONSTRAINT CHK_notificacion_medio CHECK (medio IN ('Correo','SMS','Portal')),
    CONSTRAINT CHK_notificacion_estado CHECK (estado IN ('Enviada','Pendiente','Error'))
);
GO

-- ============================================================
-- 8. INDICES DE APOYO (consultas frecuentes del sistema)
-- ============================================================

CREATE INDEX IX_usuario_rol ON usuario(id_rol);
CREATE INDEX IX_estudiante_programa ON estudiante(id_programa);
CREATE INDEX IX_plan_programa ON plan_estudio(id_programa);
CREATE INDEX IX_pec_plan ON plan_estudio_curso(id_plan);
CREATE INDEX IX_seccion_periodo ON seccion(id_periodo);
CREATE INDEX IX_seccion_docente ON seccion(id_docente_usuario);
CREATE INDEX IX_seccion_aula ON seccion(id_aula);
CREATE INDEX IX_horario_seccion ON horario_seccion(id_seccion);
CREATE INDEX IX_matricula_estudiante ON matricula(id_estudiante);
CREATE INDEX IX_matricula_periodo ON matricula(id_periodo);
CREATE INDEX IX_detalle_matricula ON detalle_matricula(id_matricula);
CREATE INDEX IX_detalle_seccion ON detalle_matricula(id_seccion);
CREATE INDEX IX_factura_estudiante ON factura(id_estudiante);
CREATE INDEX IX_factura_periodo ON factura(id_periodo);
CREATE INDEX IX_factura_estado ON factura(estado);
CREATE INDEX IX_pago_factura ON pago(id_factura);
CREATE INDEX IX_pago_estado ON pago(estado);
CREATE INDEX IX_notificacion_estudiante ON notificacion(id_estudiante);
CREATE INDEX IX_notificacion_fecha ON notificacion(fecha_envio);
CREATE INDEX IX_bitacora_fecha ON bitacora_auditoria(fecha_evento);
CREATE INDEX IX_bitacora_usuario ON bitacora_auditoria(id_usuario);
GO
