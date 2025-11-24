import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Company {
  id: string;
  name: string;
}

interface EndUser {
  id: string;
  company_id: string;
  document_number: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  access_code: string | null;
  active: boolean;
  companies: { name: string };
}

export default function BulkEdit() {
  const [personnel, setPersonnel] = useState<EndUser[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState<EndUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedRows, setEditedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [personnel, selectedCompany, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    const [personnelRes, companiesRes] = await Promise.all([
      supabase
        .from("end_users")
        .select("*, companies(name)")
        .order("full_name", { ascending: true }),
      supabase.from("companies").select("id, name").eq("active", true),
    ]);

    if (personnelRes.error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el personal",
        variant: "destructive",
      });
    } else {
      setPersonnel(personnelRes.data || []);
    }

    if (!companiesRes.error) {
      setCompanies(companiesRes.data || []);
    }

    setLoading(false);
  };

  const filterData = () => {
    let filtered = [...personnel];

    if (selectedCompany !== "all") {
      filtered = filtered.filter((p) => p.company_id === selectedCompany);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.full_name.toLowerCase().includes(term) ||
          p.document_number.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term) ||
          p.phone?.toLowerCase().includes(term)
      );
    }

    setFilteredPersonnel(filtered);
  };

  const handleCellEdit = (userId: string, field: keyof EndUser, value: any) => {
    setPersonnel((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, [field]: value } : user
      )
    );
    setEditedRows((prev) => new Set(prev).add(userId));
  };

  const handleSaveAll = async () => {
    if (editedRows.size === 0) {
      toast({
        title: "Sin cambios",
        description: "No hay cambios para guardar",
      });
      return;
    }

    setSaving(true);

    const usersToUpdate = personnel.filter((user) => editedRows.has(user.id));
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersToUpdate) {
      const { error } = await supabase
        .from("end_users")
        .update({
          document_number: user.document_number,
          full_name: user.full_name,
          phone: user.phone,
          email: user.email,
          active: user.active,
        })
        .eq("id", user.id);

      if (error) {
        errorCount++;
      } else {
        successCount++;
      }
    }

    toast({
      title: successCount > 0 ? "Cambios guardados" : "Error",
      description:
        errorCount > 0
          ? `${successCount} actualizados, ${errorCount} errores`
          : `${successCount} usuarios actualizados correctamente`,
      variant: errorCount > 0 ? "destructive" : "default",
    });

    setEditedRows(new Set());
    setSaving(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edición Masiva</h1>
          <p className="text-muted-foreground mt-2">
            Vista tipo Excel para edición rápida de personal
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
          <Button onClick={handleSaveAll} disabled={saving || editedRows.size === 0}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios ({editedRows.size})
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Nombre, documento, email, teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla editable */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Empresa</TableHead>
                    <TableHead className="w-[120px]">Documento</TableHead>
                    <TableHead className="w-[200px]">Nombre Completo</TableHead>
                    <TableHead className="w-[120px]">Teléfono</TableHead>
                    <TableHead className="w-[200px]">Email</TableHead>
                    <TableHead className="w-[150px]">Código Acceso</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonnel.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPersonnel.map((user) => (
                      <TableRow
                        key={user.id}
                        className={editedRows.has(user.id) ? "bg-warning/10" : ""}
                      >
                        <TableCell className="font-medium">{user.companies.name}</TableCell>
                        <TableCell>
                          <Input
                            value={user.document_number}
                            onChange={(e) =>
                              handleCellEdit(user.id, "document_number", e.target.value)
                            }
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={user.full_name}
                            onChange={(e) =>
                              handleCellEdit(user.id, "full_name", e.target.value)
                            }
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={user.phone || ""}
                            onChange={(e) => handleCellEdit(user.id, "phone", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={user.email || ""}
                            onChange={(e) => handleCellEdit(user.id, "email", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {user.access_code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.active ? "true" : "false"}
                            onValueChange={(value) =>
                              handleCellEdit(user.id, "active", value === "true")
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Activo</SelectItem>
                              <SelectItem value="false">Inactivo</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editedRows.size > 0 && (
        <div className="fixed bottom-6 right-6 bg-warning text-warning-foreground p-4 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            {editedRows.size} {editedRows.size === 1 ? "cambio" : "cambios"} sin guardar
          </p>
        </div>
      )}
    </div>
  );
}
