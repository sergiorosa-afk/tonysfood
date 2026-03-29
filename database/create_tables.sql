-- ============================================================
--  Tony's Food — Script de Criação do Banco de Dados
--  Versão: Sprint 2
--  Engine: MySQL 8.0+
--  Charset: utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Banco de dados
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `tonysfood_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `tonysfood_db`;

-- ============================================================
--  TABELAS DE AUTENTICAÇÃO (NextAuth / Auth.js)
-- ============================================================

-- ------------------------------------------------------------
-- units  (deve existir antes de users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `units` (
  `id`        VARCHAR(30)  NOT NULL,
  `name`      VARCHAR(191) NOT NULL,
  `slug`      VARCHAR(191) NOT NULL,
  `address`   VARCHAR(191)     NULL,
  `phone`     VARCHAR(50)      NULL,
  `active`    TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `units_slug_key` (`slug`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            VARCHAR(30)  NOT NULL,
  `name`          VARCHAR(191) NOT NULL,
  `email`         VARCHAR(191) NOT NULL,
  `emailVerified` DATETIME(3)      NULL,
  `password`      VARCHAR(191)     NULL,
  `image`         VARCHAR(191)     NULL,
  `role`          ENUM('ADMIN','MANAGER','HOST','ATTENDANT','MARKETING','AUDITOR')
                               NOT NULL DEFAULT 'ATTENDANT',
  `unitId`        VARCHAR(30)      NULL,
  `active`        TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_unitId_idx` (`unitId`),
  CONSTRAINT `users_unitId_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `units` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- accounts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `accounts` (
  `id`                VARCHAR(30)  NOT NULL,
  `userId`            VARCHAR(30)  NOT NULL,
  `type`              VARCHAR(191) NOT NULL,
  `provider`          VARCHAR(191) NOT NULL,
  `providerAccountId` VARCHAR(191) NOT NULL,
  `refresh_token`     TEXT             NULL,
  `access_token`      TEXT             NULL,
  `expires_at`        INT              NULL,
  `token_type`        VARCHAR(191)     NULL,
  `scope`             VARCHAR(191)     NULL,
  `id_token`          TEXT             NULL,
  `session_state`     VARCHAR(191)     NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_provider_providerAccountId_key` (`provider`, `providerAccountId`),
  KEY `accounts_userId_idx` (`userId`),
  CONSTRAINT `accounts_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`           VARCHAR(30)  NOT NULL,
  `sessionToken` VARCHAR(191) NOT NULL,
  `userId`       VARCHAR(30)  NOT NULL,
  `expires`      DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_sessionToken_key` (`sessionToken`),
  KEY `sessions_userId_idx` (`userId`),
  CONSTRAINT `sessions_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- verification_tokens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `verification_tokens` (
  `identifier` VARCHAR(191) NOT NULL,
  `token`      VARCHAR(191) NOT NULL,
  `expires`    DATETIME(3)  NOT NULL,
  UNIQUE KEY `verification_tokens_token_key` (`token`),
  UNIQUE KEY `verification_tokens_identifier_token_key` (`identifier`, `token`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  TABELAS DE NEGÓCIO
-- ============================================================

-- ------------------------------------------------------------
-- customers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id`           VARCHAR(30)  NOT NULL,
  `name`         VARCHAR(191) NOT NULL,
  `phone`        VARCHAR(50)      NULL,
  `email`        VARCHAR(191)     NULL,
  `unitId`       VARCHAR(30)  NOT NULL,
  `notes`        LONGTEXT         NULL,
  `segment`      ENUM('VIP','REGULAR','NEW','INACTIVE')
                               NOT NULL DEFAULT 'REGULAR',
  `visitCount`   INT          NOT NULL DEFAULT 0,
  `lastVisitAt`  DATETIME(3)      NULL,
  `preferences`  JSON             NULL  COMMENT 'Array de preferências do cliente',
  `restrictions` JSON             NULL  COMMENT 'Array de restrições alimentares',
  `active`       TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `customers_unitId_idx` (`unitId`),
  KEY `customers_segment_idx` (`segment`),
  KEY `customers_phone_idx` (`phone`),
  CONSTRAINT `customers_unitId_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `units` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- customer_tags
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customer_tags` (
  `id`         VARCHAR(30)  NOT NULL,
  `customerId` VARCHAR(30)  NOT NULL,
  `tag`        VARCHAR(100) NOT NULL,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_tags_customerId_tag_key` (`customerId`, `tag`),
  KEY `customer_tags_customerId_idx` (`customerId`),
  KEY `customer_tags_tag_idx` (`tag`),
  CONSTRAINT `customer_tags_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- reservations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reservations` (
  `id`              VARCHAR(30)  NOT NULL,
  `unitId`          VARCHAR(30)  NOT NULL,
  `customerId`      VARCHAR(30)      NULL,
  `guestName`       VARCHAR(191) NOT NULL,
  `guestPhone`      VARCHAR(50)      NULL,
  `guestEmail`      VARCHAR(191)     NULL,
  `date`            DATETIME(3)  NOT NULL,
  `partySize`       INT          NOT NULL,
  `status`          ENUM('PENDING','CONFIRMED','CANCELLED','NO_SHOW','CHECKED_IN','COMPLETED')
                                 NOT NULL DEFAULT 'PENDING',
  `channel`         ENUM('PHONE','WHATSAPP','INSTAGRAM','WALK_IN','APP','WEBSITE')
                                 NOT NULL DEFAULT 'PHONE',
  `notes`           LONGTEXT         NULL,
  `tablePreference` VARCHAR(191)     NULL,
  `confirmedAt`     DATETIME(3)      NULL,
  `cancelledAt`     DATETIME(3)      NULL,
  `checkedInAt`     DATETIME(3)      NULL,
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `reservations_unitId_idx` (`unitId`),
  KEY `reservations_customerId_idx` (`customerId`),
  KEY `reservations_date_idx` (`date`),
  KEY `reservations_status_idx` (`status`),
  KEY `reservations_unitId_date_idx` (`unitId`, `date`),
  CONSTRAINT `reservations_unitId_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `units` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `reservations_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- reservation_status_history
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reservation_status_history` (
  `id`            VARCHAR(30)  NOT NULL,
  `reservationId` VARCHAR(30)  NOT NULL,
  `status`        ENUM('PENDING','CONFIRMED','CANCELLED','NO_SHOW','CHECKED_IN','COMPLETED')
                               NOT NULL,
  `notes`         VARCHAR(500)     NULL,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `reservation_status_history_reservationId_idx` (`reservationId`),
  CONSTRAINT `reservation_status_history_reservationId_fkey`
    FOREIGN KEY (`reservationId`) REFERENCES `reservations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- queue_entries
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `queue_entries` (
  `id`            VARCHAR(30)  NOT NULL,
  `unitId`        VARCHAR(30)  NOT NULL,
  `customerId`    VARCHAR(30)      NULL,
  `guestName`     VARCHAR(191) NOT NULL,
  `guestPhone`    VARCHAR(50)      NULL,
  `partySize`     INT          NOT NULL,
  `position`      INT          NOT NULL,
  `status`        ENUM('WAITING','CALLED','SEATED','ABANDONED','TRANSFERRED')
                               NOT NULL DEFAULT 'WAITING',
  `channel`       ENUM('IN_PERSON','WHATSAPP','PHONE','APP')
                               NOT NULL DEFAULT 'IN_PERSON',
  `notes`         LONGTEXT         NULL,
  `estimatedWait` INT              NULL  COMMENT 'Tempo estimado de espera em minutos',
  `calledAt`      DATETIME(3)      NULL,
  `seatedAt`      DATETIME(3)      NULL,
  `abandonedAt`   DATETIME(3)      NULL,
  `abandonReason` VARCHAR(500)     NULL,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `queue_entries_unitId_idx` (`unitId`),
  KEY `queue_entries_customerId_idx` (`customerId`),
  KEY `queue_entries_status_idx` (`status`),
  KEY `queue_entries_unitId_status_idx` (`unitId`, `status`),
  CONSTRAINT `queue_entries_unitId_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `units` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `queue_entries_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- queue_status_history
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `queue_status_history` (
  `id`           VARCHAR(30)  NOT NULL,
  `queueEntryId` VARCHAR(30)  NOT NULL,
  `status`       ENUM('WAITING','CALLED','SEATED','ABANDONED','TRANSFERRED')
                              NOT NULL,
  `notes`        VARCHAR(500)     NULL,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `queue_status_history_queueEntryId_idx` (`queueEntryId`),
  CONSTRAINT `queue_status_history_queueEntryId_fkey`
    FOREIGN KEY (`queueEntryId`) REFERENCES `queue_entries` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- conversations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversations` (
  `id`            VARCHAR(30)  NOT NULL,
  `unitId`        VARCHAR(30)  NOT NULL,
  `customerId`    VARCHAR(30)      NULL,
  `guestName`     VARCHAR(191)     NULL,
  `guestPhone`    VARCHAR(50)  NOT NULL,
  `status`        ENUM('OPEN','PENDING','RESOLVED','CLOSED')
                               NOT NULL DEFAULT 'OPEN',
  `channel`       VARCHAR(50)  NOT NULL DEFAULT 'whatsapp',
  `assignedTo`    VARCHAR(30)      NULL  COMMENT 'userId do atendente responsável',
  `lastMessageAt` DATETIME(3)      NULL,
  `closedAt`      DATETIME(3)      NULL,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `conversations_unitId_idx` (`unitId`),
  KEY `conversations_customerId_idx` (`customerId`),
  KEY `conversations_status_idx` (`status`),
  KEY `conversations_guestPhone_idx` (`guestPhone`),
  KEY `conversations_unitId_status_idx` (`unitId`, `status`),
  CONSTRAINT `conversations_unitId_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `units` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `conversations_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id`             VARCHAR(30)              NOT NULL,
  `conversationId` VARCHAR(30)              NOT NULL,
  `content`        LONGTEXT                 NOT NULL,
  `direction`      ENUM('INBOUND','OUTBOUND') NOT NULL,
  `senderName`     VARCHAR(191)                 NULL,
  `readAt`         DATETIME(3)                  NULL,
  `createdAt`      DATETIME(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `messages_conversationId_idx` (`conversationId`),
  KEY `messages_direction_idx` (`direction`),
  KEY `messages_createdAt_idx` (`createdAt`),
  CONSTRAINT `messages_conversationId_fkey`
    FOREIGN KEY (`conversationId`) REFERENCES `conversations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- catalog_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `catalog_items` (
  `id`          VARCHAR(30)  NOT NULL,
  `unitId`      VARCHAR(30)  NOT NULL,
  `name`        VARCHAR(191) NOT NULL,
  `category`    VARCHAR(100) NOT NULL,
  `description` LONGTEXT         NULL,
  `price`       DOUBLE           NULL,
  `tags`        JSON             NULL  COMMENT 'Array de tags do item',
  `allergens`   JSON             NULL  COMMENT 'Array de alergênicos',
  `active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `featured`    TINYINT(1)   NOT NULL DEFAULT 0,
  `imageUrl`    VARCHAR(500)     NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `catalog_items_unitId_idx` (`unitId`),
  KEY `catalog_items_category_idx` (`category`),
  KEY `catalog_items_active_idx` (`active`),
  CONSTRAINT `catalog_items_unitId_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `units` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- system_events
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_events` (
  `id`          VARCHAR(30)  NOT NULL,
  `unitId`      VARCHAR(30)      NULL,
  `eventType`   VARCHAR(100) NOT NULL  COMMENT 'ex: reservation.confirmed, queue.joined',
  `entityType`  VARCHAR(100)     NULL  COMMENT 'ex: reservation, queue_entry',
  `entityId`    VARCHAR(30)      NULL,
  `payload`     JSON             NULL,
  `occurredAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `processedAt` DATETIME(3)      NULL,
  PRIMARY KEY (`id`),
  KEY `system_events_unitId_idx` (`unitId`),
  KEY `system_events_eventType_idx` (`eventType`),
  KEY `system_events_entityType_entityId_idx` (`entityType`, `entityId`),
  KEY `system_events_occurredAt_idx` (`occurredAt`),
  CONSTRAINT `system_events_unitId_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `units` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  TABELAS FUTURAS (preparadas para crescer — sprints 8 e 9)
-- ============================================================

-- ------------------------------------------------------------
-- automations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `automations` (
  `id`          VARCHAR(30)  NOT NULL,
  `unitId`      VARCHAR(30)  NOT NULL,
  `name`        VARCHAR(191) NOT NULL,
  `trigger`     VARCHAR(100) NOT NULL  COMMENT 'ex: reservation.created',
  `conditions`  JSON             NULL,
  `actions`     JSON         NOT NULL,
  `active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `automations_unitId_idx` (`unitId`),
  CONSTRAINT `automations_unitId_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `units` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- automation_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `automation_logs` (
  `id`           VARCHAR(30)  NOT NULL,
  `automationId` VARCHAR(30)  NOT NULL,
  `eventId`      VARCHAR(30)      NULL,
  `status`       ENUM('SUCCESS','FAILED','SKIPPED') NOT NULL DEFAULT 'SUCCESS',
  `output`       JSON             NULL,
  `error`        TEXT             NULL,
  `executedAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `automation_logs_automationId_idx` (`automationId`),
  CONSTRAINT `automation_logs_automationId_fkey`
    FOREIGN KEY (`automationId`) REFERENCES `automations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- integrations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `integrations` (
  `id`        VARCHAR(30)  NOT NULL,
  `unitId`    VARCHAR(30)  NOT NULL,
  `type`      VARCHAR(100) NOT NULL  COMMENT 'ex: whatsapp, google_calendar',
  `name`      VARCHAR(191) NOT NULL,
  `config`    JSON         NOT NULL  COMMENT 'Configurações específicas (sem secrets em plain text)',
  `active`    TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `integrations_unitId_idx` (`unitId`),
  CONSTRAINT `integrations_unitId_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `units` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- webhooks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `webhooks` (
  `id`        VARCHAR(30)  NOT NULL,
  `unitId`    VARCHAR(30)  NOT NULL,
  `url`       VARCHAR(500) NOT NULL,
  `events`    JSON         NOT NULL  COMMENT 'Array de event types assinados',
  `secret`    VARCHAR(191)     NULL  COMMENT 'Secret para assinatura HMAC',
  `active`    TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `webhooks_unitId_idx` (`unitId`),
  CONSTRAINT `webhooks_unitId_fkey`
    FOREIGN KEY (`unitId`) REFERENCES `units` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- webhook_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id`         VARCHAR(30)  NOT NULL,
  `webhookId`  VARCHAR(30)  NOT NULL,
  `eventType`  VARCHAR(100) NOT NULL,
  `payload`    JSON             NULL,
  `statusCode` INT              NULL,
  `response`   TEXT             NULL,
  `attempt`    INT          NOT NULL DEFAULT 1,
  `success`    TINYINT(1)   NOT NULL DEFAULT 0,
  `sentAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `webhook_logs_webhookId_idx` (`webhookId`),
  KEY `webhook_logs_success_idx` (`success`),
  CONSTRAINT `webhook_logs_webhookId_fkey`
    FOREIGN KEY (`webhookId`) REFERENCES `webhooks` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- audit_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`         VARCHAR(30)  NOT NULL,
  `userId`     VARCHAR(30)      NULL  COMMENT 'Quem fez a ação',
  `unitId`     VARCHAR(30)      NULL,
  `action`     VARCHAR(100) NOT NULL  COMMENT 'ex: reservation.update, customer.delete',
  `entityType` VARCHAR(100)     NULL,
  `entityId`   VARCHAR(30)      NULL,
  `before`     JSON             NULL  COMMENT 'Estado anterior',
  `after`      JSON             NULL  COMMENT 'Estado posterior',
  `ip`         VARCHAR(45)      NULL,
  `userAgent`  VARCHAR(500)     NULL,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_userId_idx` (`userId`),
  KEY `audit_logs_unitId_idx` (`unitId`),
  KEY `audit_logs_action_idx` (`action`),
  KEY `audit_logs_entityType_entityId_idx` (`entityType`, `entityId`),
  KEY `audit_logs_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  Prisma Migrations Table (necessária para o prisma migrate)
-- ============================================================
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id`                    VARCHAR(36)   NOT NULL,
  `checksum`              VARCHAR(64)   NOT NULL,
  `finished_at`           DATETIME(3)       NULL,
  `migration_name`        VARCHAR(255)  NOT NULL,
  `logs`                  TEXT              NULL,
  `rolled_back_at`        DATETIME(3)       NULL,
  `started_at`            DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count`   INT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
--  Criação concluída.
--  Tabelas criadas: 20
--    Auth:     users, accounts, sessions, verification_tokens
--    Core:     units, customers, customer_tags
--              reservations, reservation_status_history
--              queue_entries, queue_status_history
--              conversations, messages
--              catalog_items, system_events
--    Futuras:  automations, automation_logs
--              integrations, webhooks, webhook_logs, audit_logs
-- ============================================================
