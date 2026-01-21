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
  status: "pending_payment" | "paid" | "letter_generated" | "lawyer_validated" | "lawyer_rejected" | "email_sent" | "rdv_booked";
  created_at: string;
  letter_text?: string | null;
  victime_nom?: string | null;
  accident_date?: string | null;
  validated_fields?: {
    victime?: { nom?: string; prenom?: string };
    accident?: { date?: string };
  } | null;
}

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "outline" | "destructive"; icon: typeof Clock }> = {
  pending_payment: {
    label: "En attente paiement",
    variant: "outline",
    icon: Clock,
  },
  paid: {
    label: "Payé - En attente génération",
    variant: "secondary",
    icon: Clock,
  },
  letter_generated: {
    label: "À valider",
    variant: "secondary",
    icon: Clock,
  },
  lawyer_validated: {
    label: "Validé",
    variant: "default",
    icon: CheckCircle,
  },
  lawyer_rejected: {
    label: "Rejeté",
    variant: "destructive",
    icon: Clock,
  },
  email_sent: {
    label: "Envoyé",
    variant: "outline",
    icon: Send,
  },
  rdv_booked: {
    label: "RDV réservé",
    variant: "default",
    icon: CheckCircle,
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

  // Dossiers en attente de validation par avocate
  const pendingCount =
    dossiers?.filter((d) => d.status === "letter_generated").length || 0;
  // Dossiers validés mais pas encore envoyés
  const validatedCount =
    dossiers?.filter((d) => d.status === "lawyer_validated").length || 0;
  // Dossiers envoyés aux clients
  const sentCount = dossiers?.filter((d) => d.status === "email_sent").length || 0;

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
                    const status = statusConfig[dossier.status] || statusConfig.paid;
                    const StatusIcon = status.icon;
                    // Support both old context format and new flat fields
                    const victimeName = dossier.victime_nom
                      || (dossier.validated_fields?.victime
                          ? `${dossier.validated_fields.victime.prenom || ""} ${dossier.validated_fields.victime.nom || ""}`.trim()
                          : "-");

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
                          {dossier.accident_date || dossier.validated_fields?.accident?.date || "-"}
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
                              {dossier.status === "letter_generated"
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
