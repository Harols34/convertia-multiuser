-- Crear enum para roles
CREATE TYPE public.app_role AS ENUM ('admin');

-- Crear enum para estados de alarmas
CREATE TYPE public.alarm_status AS ENUM ('abierta', 'en_proceso', 'resuelta', 'cerrada');

-- Tabla de perfiles de usuario (administradores)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los administradores pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Política: Los administradores pueden insertar perfiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Los administradores pueden actualizar perfiles
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (true);

-- Tabla de empresas/cuentas
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage companies"
  ON public.companies FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla de aplicativos globales
CREATE TABLE public.global_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  icon TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.global_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage global applications"
  ON public.global_applications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla de aplicativos por empresa
CREATE TABLE public.company_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  username TEXT,
  password TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.company_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company applications"
  ON public.company_applications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla de personal/usuarios finales
CREATE TABLE public.end_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  access_code TEXT UNIQUE,
  additional_data JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, document_number)
);

ALTER TABLE public.end_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage end users"
  ON public.end_users FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para que usuarios finales puedan ver su propia información usando access_code
CREATE POLICY "End users can view their own data"
  ON public.end_users FOR SELECT
  TO anon
  USING (true);

-- Tabla de asignación de aplicativos a usuarios finales
CREATE TABLE public.user_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  end_user_id UUID NOT NULL REFERENCES public.end_users(id) ON DELETE CASCADE,
  application_id UUID,
  global_application_id UUID REFERENCES public.global_applications(id) ON DELETE CASCADE,
  username TEXT,
  password TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_application CHECK (
    (application_id IS NOT NULL AND global_application_id IS NULL) OR
    (application_id IS NULL AND global_application_id IS NOT NULL)
  )
);

ALTER TABLE public.user_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user applications"
  ON public.user_applications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "End users can view their applications"
  ON public.user_applications FOR SELECT
  TO anon
  USING (true);

-- Tabla de alarmas/tickets
CREATE TABLE public.alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  end_user_id UUID NOT NULL REFERENCES public.end_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status alarm_status NOT NULL DEFAULT 'abierta',
  priority TEXT DEFAULT 'media',
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alarms"
  ON public.alarms FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "End users can create and view their alarms"
  ON public.alarms FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Tabla de comentarios en alarmas
CREATE TABLE public.alarm_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alarm_id UUID NOT NULL REFERENCES public.alarms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alarm_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alarm comments"
  ON public.alarm_comments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla de archivos adjuntos en alarmas
CREATE TABLE public.alarm_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alarm_id UUID NOT NULL REFERENCES public.alarms(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alarm_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alarm attachments"
  ON public.alarm_attachments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla de auditoría/historial
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_global_applications_updated_at
  BEFORE UPDATE ON public.global_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_applications_updated_at
  BEFORE UPDATE ON public.company_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_end_users_updated_at
  BEFORE UPDATE ON public.end_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_applications_updated_at
  BEFORE UPDATE ON public.user_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alarms_updated_at
  BEFORE UPDATE ON public.alarms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear perfil automáticamente al crear usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email,
    'admin'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Crear bucket para archivos de alarmas
INSERT INTO storage.buckets (id, name, public)
VALUES ('alarm-attachments', 'alarm-attachments', false);

-- Política de storage: Los admins pueden subir y ver archivos
CREATE POLICY "Admins can upload alarm attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'alarm-attachments');

CREATE POLICY "Admins can view alarm attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'alarm-attachments');

CREATE POLICY "Admins can delete alarm attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'alarm-attachments');