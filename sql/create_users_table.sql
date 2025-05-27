-- Estructura de tabla para la tabla `users`
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_type` ENUM('CC', 'TI', 'CE', 'PP') NOT NULL,
  `document_number` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20),
  `address` text,
  `user_type` ENUM('estudiante', 'profesor', 'administrativo') NOT NULL,
  `state` ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_document` (`document_type`, `document_number`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_state` (`state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
