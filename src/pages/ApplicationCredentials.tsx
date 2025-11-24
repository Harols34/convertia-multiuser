import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, Search, Eye, EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Company {
  id: string;
  name: string;
}

interface Application {
  id: string;
  name: string;
  type: "global" | "company";
}

interface EndUser {
  id: string;
  full_name: string;
  document_number: string;
}

interface UserAppCredential {
  user_id: string;
  app_id: string;
  username: string;
  password: string;
  notes: string;
}

export default function ApplicationCredentials() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [users, setUsers] = useState<EndUser[]>([]);
  const [credentials, setCredentials] = useState<UserAppCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadApplicationsAndUsers();
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedApp && selectedCompany) {
      loadCredentials();
    }
  }, [selectedApp, selectedCompany]);

  const loadCompanies = async () => {
    const { data } = await supabase
      .from("companies")
      .select("id, name")
      .eq("active", true)
      .order("name");
    if (data) setCompanies(data);
  };

  const loadApplicationsAndUsers = async () => {
    setLoading(true);
    const [globalApps, companyApps, usersData] = await Promise.all([
      supabase.from("global_applications").select("id, name").eq("active", true),
      supabase
        .from("company_applications")
        .select("id, name")
        .eq("company_id", selectedCompany)
        .eq("active", true),
      supabase
        .from("end_users")
        .select("id, full_name, document_number")
        .eq("company_id", selectedCompany)
        .eq("active", true)
        .order("full_name"),
    ]);

    const apps: Application[] = [
      ...(globalApps.data?.map((a) => ({ ...a, type: "global" as const })) || []),
      ...(companyApps.data?.map((a) => ({ ...a, type: "company" as const })) || []),
    ];

    setApplications(apps);
    setUsers(usersData.data || []);
    setLoading(false);
  };

  const loadCredentials = async () => {
    const isGlobal = applications.find((a) => a.id === selectedApp)?.type === "global";
    
    // Get all user applications for this app
    const { data } = await supabase
      .from("user_applications")
      .select("*")
      .eq(isGlobal ? "global_application_id" : "application_id", selectedApp);

    const creds: UserAppCredential[] = users.map((user) => {
      const existing = data?.find((d) => d.end_user_id === user.id);
      return {
        user_id: user.id,
        app_id: selectedApp,
        username: existing?.username || "",
        password: existing?.password || "",
        notes: existing?.notes || "",
      };
    });

    setCredentials(creds);
  };

  const handleCredentialChange = (
    userId: string,
    field: "username" | "password" | "notes",
    value: string
  ) => {
    setCredentials((prev) =>
      prev.map((c) => (c.user_id === userId ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const isGlobal = applications.find((a) => a.id === selectedApp)?.type === "global";

    try {
      for (const cred of credentials) {
        const { data: existing } = await supabase
          .from("user_applications")
          .select("id")
          .eq("end_user_id", cred.user_id)
          .eq(isGlobal ? "global_application_id" : "application_id", selectedApp)
          .single();

        const payload = {
          end_user_id: cred.user_id,
          [isGlobal ? "global_application_id" : "application_id"]: selectedApp,
          username: cred.username || null,
          password: cred.password || null,
          notes: cred.notes || null,
        };

        if (existing) {
          await supabase
            .from("user_applications")
            .update(payload)
            .eq("id", existing.id);
        } else {
          await supabase.from("user_applications").insert([payload]);
        }
      }

      toast({ title: "Credenciales guardadas correctamente" });
      loadCredentials();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las credenciales",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Credenciales</h1>
        <p className="text-muted-foreground mt-2">
          Asigna usuarios y contraseñas a los aplicativos por empresa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selección</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Aplicativo</label>
              <Select
                value={selectedApp}
                onValueChange={setSelectedApp}
                disabled={!selectedCompany}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un aplicativo" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name} ({app.type === "global" ? "Global" : "Empresa"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedApp && selectedCompany && (
        <Card>
          <CardHeader className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>Credenciales - {users.filter(u => 
                u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.document_number.includes(searchTerm)
              ).length} usuarios</CardTitle>
              <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadCredentials}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recargar
              </Button>
              <Button onClick={handleSaveAll} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Todos
              </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Usuario</th>
                    <th className="text-left p-3 font-medium">Documento</th>
                    <th className="text-left p-3 font-medium">Usuario App</th>
                    <th className="text-left p-3 font-medium">Contraseña</th>
                    <th className="text-left p-3 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials
                    .filter((cred) => {
                      const user = users.find((u) => u.id === cred.user_id);
                      if (!user) return false;
                      return (
                        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.document_number.includes(searchTerm)
                      );
                    })
                    .map((cred) => {
                    const user = users.find((u) => u.id === cred.user_id);
                    return (
                      <tr key={cred.user_id} className="border-t hover:bg-muted/50">
                        <td className="p-3">{user?.full_name}</td>
                        <td className="p-3">{user?.document_number}</td>
                        <td className="p-3">
                          <Input
                            value={cred.username}
                            onChange={(e) =>
                              handleCredentialChange(cred.user_id, "username", e.target.value)
                            }
                            placeholder="usuario123"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Input
                              type={visiblePasswords[cred.user_id] ? "text" : "password"}
                              value={cred.password}
                              onChange={(e) =>
                                handleCredentialChange(cred.user_id, "password", e.target.value)
                              }
                              placeholder="contraseña"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setVisiblePasswords(prev => ({
                                  ...prev,
                                  [cred.user_id]: !prev[cred.user_id]
                                }));
                              }}
                              className="px-2"
                            >
                              {visiblePasswords[cred.user_id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="p-3">
                          <Input
                            value={cred.notes}
                            onChange={(e) =>
                              handleCredentialChange(cred.user_id, "notes", e.target.value)
                            }
                            placeholder="notas opcionales"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
