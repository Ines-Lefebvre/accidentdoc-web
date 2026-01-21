"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Send,
  Save,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Mail,
  Building,
} from "lucide-react";

interface Dossier {
  id: string;
  request_id: string;
  customer_email: string;
  customer_name: string | null;
  letter_text: string;
  status: "paid" | "letter_generated" | "lawyer_validated" | "lawyer_rejected" | "email_sent" | "rdv_booked";
  created_at: string;
  validated_at: string | null;
  victime_nom?: string | null;
  accident_date?: string | null;
  validated_fields?: {
    victime?: { nom?: string; prenom?: string };
    accident?: { date?: string; lieu?: string };
    employeur?: { nom_raison_sociale?: string };
  } | null;
}

export default function DossierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [letterText, setLetterText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadDossier();
  }, [dossierId]);

  async function loadDossier() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("dossiers")
        .select("*")
        .eq("id", dossierId)
        .single();

      if (fetchError) throw fetchError;

      setDossier(data);
      setLetterText(data.letter_text || "");
    } catch (err) {
      console.error("Error loading dossier:", err);
      setError("Impossible de charger le dossier");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!dossier) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("dossiers")
        .update({ letter_text: letterText })
        .eq("id", dossierId);

      if (updateError) throw updateError;

      setDossier({ ...dossier, letter_text: letterText });
      setHasChanges(false);
      setSuccess("Modifications enregistrées");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving:", err);
      setError("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleValidateAndSend() {
    if (!dossier) return;

    setValidating(true);
    setError(null);

    try {
      // Sauvegarder d'abord si modifications
      if (hasChanges) {
        const supabase = createClient();
        await supabase
          .from("dossiers")
          .update({ letter_text: letterText })
          .eq("id", dossierId);
      }

      // Appeler l'API de validation
      const response = await fetch("/api/admin/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossier_id: dossierId,
          letter_text: letterText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la validation");
      }

      setSuccess("Lettre validée et envoyée au client !");
      setDossier({ ...dossier, status: "email_sent" });
      setHasChanges(false);

      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (err) {
      console.error("Error validating:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la validation"
      );
    } finally {
      setValidating(false);
    }
  }

  function handleTextChange(newText: string) {
    setLetterText(newText);
    setHasChanges(newText !== dossier?.letter_text);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Dossier non trouvé
            </p>
            <Button asChild className="w-full">
              <Link href="/admin">Retour au dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSent = dossier.status === "email_sent";
  const isValidated = dossier.status === "lawyer_validated";
  const canEdit = dossier.status === "letter_generated";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            <div className="h-6 border-l" />
            <h1 className="text-lg font-semibold">
              Dossier #{dossier.request_id.slice(-8)}
            </h1>
            <Badge
              variant={
                isSent
                  ? "outline"
                  : isValidated
                    ? "default"
                    : "secondary"
              }
            >
              {isSent
                ? "Envoyé"
                : isValidated
                  ? "Validé"
                  : dossier.status === "letter_generated"
                    ? "À valider"
                    : dossier.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={validating}>
                      {validating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Valider et envoyer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer l&apos;envoi</AlertDialogTitle>
                      <AlertDialogDescription>
                        La lettre de réserves sera envoyée par email à{" "}
                        <strong>{dossier.customer_email}</strong> avec votre
                        signature.
                        <br />
                        <br />
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleValidateAndSend}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmer l&apos;envoi
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Email client</div>
                  <div className="text-sm text-muted-foreground">
                    {dossier.customer_email}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Victime</div>
                  <div className="text-sm text-muted-foreground">
                    {dossier.victime_nom ||
                     (dossier.validated_fields?.victime
                       ? `${dossier.validated_fields.victime.prenom || ""} ${dossier.validated_fields.victime.nom || ""}`.trim()
                       : "-")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Date accident</div>
                  <div className="text-sm text-muted-foreground">
                    {dossier.accident_date || dossier.validated_fields?.accident?.date || "-"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Employeur</div>
                  <div className="text-sm text-muted-foreground">
                    {dossier.validated_fields?.employeur?.nom_raison_sociale || "-"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Créé le</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(dossier.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {dossier.validated_at && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-1 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">Validé le</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(dossier.validated_at).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Letter Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Lettre de réserves</CardTitle>
              <CardDescription>
                {isSent
                  ? "Lettre envoyée au client"
                  : "Vérifiez et modifiez le contenu si nécessaire avant validation"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={letterText}
                onChange={(e) => handleTextChange(e.target.value)}
                disabled={!canEdit}
                className="min-h-[500px] font-mono text-sm resize-none"
                placeholder="Contenu de la lettre..."
              />

              {hasChanges && canEdit && (
                <p className="text-sm text-amber-600 mt-2">
                  Modifications non enregistrées
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
