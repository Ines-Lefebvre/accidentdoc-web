import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogOut, FileText, Clock, CheckCircle, Send } from "lucide-react";

interface Dossier {
  id: string;
  request_id: string;
  customer_email: string;
  customer_name: string | null;
  status: "pending" | "validated" | "sent";
  created_at: string;
  context: {
    victime_nom?: string;
    victime_prenom?: string;
    accident_date?: string;
  } | null;
}

const statusConfig = {
  pending: {
    label: "En attente",
    variant: "secondary" as const,
    icon: Clock,
  },
  validated: {
    label: "Validé",
    variant: "default" as const,
    icon: CheckCircle,
  },
  sent: {
    label: "Envoyé",
    variant: "outline" as const,
    icon: Send,
  },
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Vérifier l'utilisateur
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Récupérer les dossiers
  const { data: dossiers, error } = await supabase
    .from("dossiers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching dossiers:", error);
  }

  const pendingCount =
    dossiers?.filter((d) => d.status === "pending").length || 0;
  const validatedCount =
    dossiers?.filter((d) => d.status === "validated").length || 0;
  const sentCount = dossiers?.filter((d) => d.status === "sent").length || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">AccidentDoc Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action="/api/admin/logout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>En attente de validation</CardDescription>
              <CardTitle className="text-3xl">{pendingCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Dossiers à traiter
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Validés</CardDescription>
              <CardTitle className="text-3xl">{validatedCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                En attente d&apos;envoi
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Envoyés</CardDescription>
              <CardTitle className="text-3xl">{sentCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Lettres envoyées aux clients
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dossiers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Dossiers</CardTitle>
            <CardDescription>
              Liste de tous les dossiers de lettres de réserves
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!dossiers || dossiers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun dossier pour le moment
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Victime</TableHead>
                    <TableHead>Date accident</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiers.map((dossier: Dossier) => {
                    const status = statusConfig[dossier.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const victimeName = dossier.context
                      ? `${dossier.context.victime_prenom || ""} ${dossier.context.victime_nom || ""}`.trim()
                      : "-";

                    return (
                      <TableRow key={dossier.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(dossier.created_at).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {dossier.customer_name || "-"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {dossier.customer_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{victimeName || "-"}</TableCell>
                        <TableCell>
                          {dossier.context?.accident_date || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/dossier/${dossier.id}`}>
                              {dossier.status === "pending"
                                ? "Valider"
                                : "Voir"}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
