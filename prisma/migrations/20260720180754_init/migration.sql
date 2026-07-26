-- CreateTable
CREATE TABLE "Agent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hostname" TEXT NOT NULL,
    "os" TEXT,
    "ip_address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "last_seen" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Command" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agent_id" INTEGER NOT NULL,
    "command_type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" DATETIME,
    CONSTRAINT "Command_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommandResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "command_id" INTEGER NOT NULL,
    "output" TEXT,
    "status" TEXT NOT NULL,
    "executed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommandResult_command_id_fkey" FOREIGN KEY ("command_id") REFERENCES "Command" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CommandResult_command_id_key" ON "CommandResult"("command_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
