-- 003_advanced_schema.sql

-- Organizations Table
CREATE TABLE public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Organization Members Table
CREATE TABLE public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Engineer', 'Technician', 'Viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Machines Table
CREATE TABLE public.machines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    machine_code TEXT,
    machine_type TEXT,
    manufacturer TEXT,
    model TEXT,
    location TEXT,
    description TEXT,
    status TEXT DEFAULT 'Operational',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alter Documents Table to add Document Intelligence & Versioning & Machine association
ALTER TABLE public.documents
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    ADD COLUMN document_type TEXT,
    ADD COLUMN classification_confidence FLOAT,
    ADD COLUMN summary TEXT,
    ADD COLUMN key_topics JSONB,
    ADD COLUMN version_number TEXT DEFAULT '1.0',
    ADD COLUMN is_current BOOLEAN DEFAULT true,
    ADD COLUMN previous_version_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    ADD COLUMN change_summary TEXT;

-- Document FAQs Table
CREATE TABLE public.document_faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Maintenance Tasks / Records Table
CREATE TABLE public.maintenance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    maintenance_type TEXT,
    description TEXT NOT NULL,
    technician TEXT,
    date TIMESTAMP WITH TIME ZONE,
    next_due_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Overdue')) DEFAULT 'Scheduled',
    notes TEXT,
    action_taken TEXT,
    parts_replaced TEXT,
    downtime TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update trigger for machines
CREATE TRIGGER update_machines_updated_at
BEFORE UPDATE ON machines
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for maintenance_records
CREATE TRIGGER update_maintenance_records_updated_at
BEFORE UPDATE ON maintenance_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (allowing users to interact with their own data for now until Org logic is strictly enforced)

-- Machines
CREATE POLICY "Users can view own machines" ON machines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own machines" ON machines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own machines" ON machines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own machines" ON machines FOR DELETE USING (auth.uid() = user_id);

-- Document FAQs
CREATE POLICY "Users can view faqs of their documents" ON document_faqs FOR SELECT
USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_faqs.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can insert faqs for their documents" ON document_faqs FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_faqs.document_id AND documents.user_id = auth.uid()));

-- Maintenance Records
CREATE POLICY "Users can view own maintenance records" ON maintenance_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM machines WHERE machines.id = maintenance_records.machine_id AND machines.user_id = auth.uid())
);
CREATE POLICY "Users can insert own maintenance records" ON maintenance_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM machines WHERE machines.id = maintenance_records.machine_id AND machines.user_id = auth.uid())
);
CREATE POLICY "Users can update own maintenance records" ON maintenance_records FOR UPDATE USING (
    EXISTS (SELECT 1 FROM machines WHERE machines.id = maintenance_records.machine_id AND machines.user_id = auth.uid())
);
CREATE POLICY "Users can delete own maintenance records" ON maintenance_records FOR DELETE USING (
    EXISTS (SELECT 1 FROM machines WHERE machines.id = maintenance_records.machine_id AND machines.user_id = auth.uid())
);

-- Audit Logs
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
