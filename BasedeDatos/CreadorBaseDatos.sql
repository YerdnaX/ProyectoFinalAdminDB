CREATE DATABASE SistemaMatriculaUniversitaria;
GO

USE SistemaMatriculaUniversitaria;
GO

-- =========================
-- 1. Seguridad
-- =========================

CREATE TABLE rol (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200) NULL
);
GO

CREATE TABLE permiso (
    id_permiso INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(200) NULL
);
GO

CREATE TABLE rol_permiso (
    id_rol INT NOT NULL,
    id_permiso INT NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    CONSTRAINT FK_rol_permiso_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol),
    CONSTRAINT FK_rol_permiso_permiso FOREIGN KEY (id_permiso) REFERENCES permiso(id_permiso)
);
GO

CREATE TABLE usuario (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    id_rol INT NOT NULL,
    identificador_sso VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    activo BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);
GO

CREATE TABLE bitacora_auditoria (
    id_bitacora BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NULL,
    entidad VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    descripcion VARCHAR(500) NULL,
    fecha_evento DATETIME NOT NULL DEFAULT GETDATE(),
    ip_origen VARCHAR(50) NULL,
    CONSTRAINT FK_bitacora_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);
GO

-- =========================
-- 2. Gestión académica
-- =========================

CREATE TABLE programa_academico (
    id_programa INT IDENTITY(1,1) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    nivel VARCHAR(50) NULL,
    activo BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE plan_estudio (
    id_plan INT IDENTITY(1,1) PRIMARY KEY,
    id_programa INT NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    fecha_vigencia_inicio DATE NOT NULL,
    fecha_vigencia_fin DATE NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_plan_estudio_programa FOREIGN KEY (id_programa) REFERENCES programa_academico(id_programa)
);
GO

CREATE TABLE curso (
    id_curso INT IDENTITY(1,1) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(300) NULL,
    creditos INT NOT NULL,
    horas_semanales INT NULL,
    activo BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE plan_estudio_curso (
    id_plan_curso INT IDENTITY(1,1) PRIMARY KEY,
    id_plan INT NOT NULL,
    id_curso INT NOT NULL,
    ciclo INT NULL,
    obligatorio BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_plan_curso UNIQUE (id_plan, id_curso),
    CONSTRAINT FK_plan_estudio_curso_plan FOREIGN KEY (id_plan) REFERENCES plan_estudio(id_plan),
    CONSTRAINT FK_plan_estudio_curso_curso FOREIGN KEY (id_curso) REFERENCES curso(id_curso)
);
GO

CREATE TABLE curso_prerrequisito (
    id_curso INT NOT NULL,
    id_curso_prerrequisito INT NOT NULL,
    PRIMARY KEY (id_curso, id_curso_prerrequisito),
    CONSTRAINT FK_curso_prerreq_curso FOREIGN KEY (id_curso) REFERENCES curso(id_curso),
    CONSTRAINT FK_curso_prerreq_req FOREIGN KEY (id_curso_prerrequisito) REFERENCES curso(id_curso),
    CONSTRAINT CHK_curso_prerreq_diferente CHECK (id_curso <> id_curso_prerrequisito)
);
GO


CREATE TABLE curso_correquisito (
    id_curso INT NOT NULL,
    id_curso_correquisito INT NOT NULL,
    PRIMARY KEY (id_curso, id_curso_correquisito),
    CONSTRAINT FK_curso_correquisito_curso FOREIGN KEY (id_curso) REFERENCES curso(id_curso),
    CONSTRAINT FK_curso_correquisito_req FOREIGN KEY (id_curso_correquisito) REFERENCES curso(id_curso),
    CONSTRAINT CHK_curso_correquisito_diferente CHECK (id_curso <> id_curso_correquisito)
);
GO


CREATE TABLE periodo_academico (
    id_periodo INT IDENTITY(1,1) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    tipo_periodo VARCHAR(30) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_inicio_matricula DATE NOT NULL,
    fecha_fin_matricula DATE NOT NULL,
    limite_creditos INT NOT NULL,
    activo BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE estudiante (
    id_estudiante INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    carne VARCHAR(20) NOT NULL UNIQUE,
    id_programa INT NOT NULL,
    estado_academico VARCHAR(50) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    saldo_pendiente DECIMAL(10,2) NOT NULL DEFAULT 0,
    bloqueado_financiero BIT NOT NULL DEFAULT 0,
    bloqueado_academico BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_estudiante_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT FK_estudiante_programa FOREIGN KEY (id_programa) REFERENCES programa_academico(id_programa)
);
GO

-- =========================
-- 3. Oferta académica
-- =========================

CREATE TABLE aula (
    id_aula INT IDENTITY(1,1) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    edificio VARCHAR(100) NULL,
    capacidad INT NOT NULL,
    activa BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE seccion (
    id_seccion INT IDENTITY(1,1) PRIMARY KEY,
    id_curso INT NOT NULL,
    id_periodo INT NOT NULL,
    codigo_seccion VARCHAR(20) NOT NULL,
    id_docente_usuario INT NULL,
    id_aula INT NULL,
    cupo_maximo INT NOT NULL,
    cupo_disponible INT NOT NULL,
    modalidad VARCHAR(30) NULL,
    estado VARCHAR(30) NOT NULL,
    CONSTRAINT UQ_seccion UNIQUE (id_curso, id_periodo, codigo_seccion),
    CONSTRAINT FK_seccion_curso FOREIGN KEY (id_curso) REFERENCES curso(id_curso),
    CONSTRAINT FK_seccion_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo),
    CONSTRAINT FK_seccion_docente FOREIGN KEY (id_docente_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT FK_seccion_aula FOREIGN KEY (id_aula) REFERENCES aula(id_aula),
    CONSTRAINT CHK_seccion_cupos CHECK (cupo_maximo >= 0 AND cupo_disponible >= 0 AND cupo_disponible <= cupo_maximo)
);
GO

CREATE TABLE horario_seccion (
    id_horario INT IDENTITY(1,1) PRIMARY KEY,
    id_seccion INT NOT NULL,
    dia_semana VARCHAR(15) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CONSTRAINT FK_horario_seccion FOREIGN KEY (id_seccion) REFERENCES seccion(id_seccion),
    CONSTRAINT CHK_horario_rango CHECK (hora_inicio < hora_fin)
);
GO

-- =========================
-- 4. Matrícula
-- =========================

CREATE TABLE matricula (
    id_matricula INT IDENTITY(1,1) PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_periodo INT NOT NULL,
    fecha_matricula DATETIME NOT NULL DEFAULT GETDATE(),
    estado VARCHAR(30) NOT NULL,
    total_creditos INT NOT NULL DEFAULT 0,
    total_monto DECIMAL(10,2) NOT NULL DEFAULT 0,
    confirmada BIT NOT NULL DEFAULT 0,
    comprobante VARCHAR(100) NULL,
    CONSTRAINT UQ_matricula_estudiante_periodo UNIQUE (id_estudiante, id_periodo),
    CONSTRAINT FK_matricula_estudiante FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    CONSTRAINT FK_matricula_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo)
);
GO

CREATE TABLE detalle_matricula (
    id_detalle_matricula INT IDENTITY(1,1) PRIMARY KEY,
    id_matricula INT NOT NULL,
    id_seccion INT NOT NULL,
    costo DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL,
    CONSTRAINT UQ_detalle_matricula UNIQUE (id_matricula, id_seccion),
    CONSTRAINT FK_detalle_matricula_matricula FOREIGN KEY (id_matricula) REFERENCES matricula(id_matricula),
    CONSTRAINT FK_detalle_matricula_seccion FOREIGN KEY (id_seccion) REFERENCES seccion(id_seccion)
);
GO

-- =========================
-- 5. Facturación y pagos
-- =========================

CREATE TABLE factura (
    id_factura INT IDENTITY(1,1) PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_periodo INT NOT NULL,
    numero_factura VARCHAR(30) NOT NULL UNIQUE,
    fecha_emision DATETIME NOT NULL DEFAULT GETDATE(),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    descuentos DECIMAL(10,2) NOT NULL DEFAULT 0,
    recargos DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    saldo DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL,
    CONSTRAINT FK_factura_estudiante FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    CONSTRAINT FK_factura_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo)
);
GO

CREATE TABLE estado_cuenta (
    id_estado_cuenta INT IDENTITY(1,1) PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_periodo INT NOT NULL,
    fecha_generacion DATETIME NOT NULL DEFAULT GETDATE(),
    monto_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    monto_pagado DECIMAL(10,2) NOT NULL DEFAULT 0,
    saldo_pendiente DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL,
    CONSTRAINT FK_estado_cuenta_estudiante FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    CONSTRAINT FK_estado_cuenta_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo)
);
GO

CREATE TABLE pago (
    id_pago INT IDENTITY(1,1) PRIMARY KEY,
    id_factura INT NOT NULL,
    fecha_pago DATETIME NOT NULL DEFAULT GETDATE(),
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    referencia_pasarela VARCHAR(100) NULL,
    estado VARCHAR(30) NOT NULL,
    observacion VARCHAR(300) NULL,
    CONSTRAINT FK_pago_factura FOREIGN KEY (id_factura) REFERENCES factura(id_factura)
);
GO

-- =========================
-- 6. Notificaciones
-- =========================

CREATE TABLE notificacion (
    id_notificacion INT IDENTITY(1,1) PRIMARY KEY,
    id_estudiante INT NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    asunto VARCHAR(150) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    fecha_envio DATETIME NOT NULL DEFAULT GETDATE(),
    medio VARCHAR(30) NOT NULL,
    estado VARCHAR(30) NOT NULL,
    CONSTRAINT FK_notificacion_estudiante FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante)
);
GO