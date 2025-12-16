-- ============================================================================
-- Task Quantity Expansion - Database Migration
-- 任務數量擴展 - 資料庫遷移
-- 
-- Version: 1.0.0
-- Date: 2025-12-11
-- Author: GigHub Development Team
-- ============================================================================

-- SECTION 1: Extend Tasks Table with Quantity Fields
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS total_quantity DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
ADD COLUMN IF NOT EXISTS completed_quantity DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS enable_quantity_tracking BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_complete_on_quantity_reached BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS auto_send_to_qc BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_tasks_quantity_tracking 
  ON tasks(enable_quantity_tracking) WHERE enable_quantity_tracking = TRUE;

-- SECTION 2: Create Log-Task Junction Table
CREATE TABLE IF NOT EXISTS log_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id UUID NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  task_title VARCHAR(255) NOT NULL,
  quantity_completed DECIMAL(10,2) NOT NULL CHECK (quantity_completed > 0),
  unit VARCHAR(50) NOT NULL,
  notes TEXT,
  task_status_at_log VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_log_task UNIQUE(log_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_log_tasks_log_id ON log_tasks(log_id);
CREATE INDEX IF NOT EXISTS idx_log_tasks_task_id ON log_tasks(task_id);

-- SECTION 3: Create Quality Control Table
CREATE TABLE IF NOT EXISTS quality_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  task_title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  inspector_id UUID REFERENCES accounts(id),
  inspector_name VARCHAR(255),
  notes TEXT,
  photos TEXT[],
  issues JSONB,
  inspected_quantity DECIMAL(10,2),
  passed_quantity DECIMAL(10,2),
  rejected_quantity DECIMAL(10,2),
  unit VARCHAR(50),
  inspection_start_date TIMESTAMPTZ,
  inspection_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_qc_task_id ON quality_controls(task_id);
CREATE INDEX IF NOT EXISTS idx_qc_status ON quality_controls(status);

-- SECTION 4: Create Task Progress Audit Table
CREATE TABLE IF NOT EXISTS task_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  log_id UUID REFERENCES logs(id) ON DELETE SET NULL,
  qc_id UUID REFERENCES quality_controls(id) ON DELETE SET NULL,
  quantity_delta DECIMAL(10,2) NOT NULL,
  total_quantity DECIMAL(10,2) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  actor_id UUID NOT NULL REFERENCES accounts(id),
  actor_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_created_at ON task_progress(created_at DESC);
