"use client";

import React from "react";
import {
  Building2,
  User,
  Calendar,
  MapPin,
  AlertTriangle,
  Users,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ExtractedData } from "@/types";

interface ExtractedDataDisplayProps {
  data: ExtractedData;
  validationFields?: Record<
    string,
    {
      label: string;
      value: string | null;
      isEmpty: boolean;
      required: boolean;
    }
  >;
  className?: string;
}

interface DataFieldProps {
  label: string;
  value: string | null | undefined;
  required?: boolean;
  isEmpty?: boolean;
}

function DataField({ label, value, required, isEmpty }: DataFieldProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </span>
      <span
        className={cn(
          "text-sm",
          isEmpty || !value
            ? "text-muted-foreground italic"
            : "text-foreground font-medium"
        )}
      >
        {value || "Non renseigné"}
      </span>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">{children}</div>
      </CardContent>
    </Card>
  );
}

export function ExtractedDataDisplay({
  data,
  validationFields,
  className,
}: ExtractedDataDisplayProps) {
  const getFieldValue = (section: string, field: string) => {
    const key = `${section}.${field}`;
    if (validationFields?.[key]) {
      return {
        value: validationFields[key].value,
        isEmpty: validationFields[key].isEmpty,
        required: validationFields[key].required,
      };
    }
    // Fallback sur les données brutes
    const sectionData = data[section as keyof ExtractedData];
    if (typeof sectionData === "object" && sectionData !== null) {
      return {
        value: (sectionData as Record<string, unknown>)[field] as string | null,
        isEmpty: !(sectionData as Record<string, unknown>)[field],
        required: false,
      };
    }
    return { value: null, isEmpty: true, required: false };
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Type de déclaration */}
      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
        <FileText className="h-5 w-5 text-primary" />
        <span className="font-medium">
          {data.type === "AT_normale" && "Déclaration d'Accident du Travail"}
          {data.type === "AT_interim" &&
            "Déclaration AT - Travailleur Intérimaire"}
          {data.type === "maladie_professionnelle" &&
            "Déclaration de Maladie Professionnelle"}
        </span>
      </div>

      {/* Employeur */}
      <Section
        title="Employeur"
        icon={<Building2 className="h-4 w-4 text-primary" />}
      >
        <DataField
          label="Raison sociale"
          {...getFieldValue("employeur", "nom_raison_sociale")}
        />
        <DataField label="SIRET" {...getFieldValue("employeur", "siret")} />
        <DataField
          label="Adresse"
          {...getFieldValue("employeur", "adresse")}
        />
        <DataField
          label="Téléphone"
          {...getFieldValue("employeur", "telephone")}
        />
      </Section>

      {/* Victime */}
      <Section
        title="Victime"
        icon={<User className="h-4 w-4 text-primary" />}
      >
        <DataField label="Nom" {...getFieldValue("victime", "nom")} />
        <DataField label="Prénom" {...getFieldValue("victime", "prenom")} />
        <DataField
          label="N° Sécurité sociale"
          {...getFieldValue("victime", "numero_secu")}
        />
        <DataField
          label="Date de naissance"
          {...getFieldValue("victime", "date_naissance")}
        />
        <DataField
          label="Profession"
          {...getFieldValue("victime", "profession")}
        />
        <DataField
          label="Adresse"
          {...getFieldValue("victime", "adresse")}
        />
      </Section>

      {/* Accident */}
      <Section
        title="Accident"
        icon={<AlertTriangle className="h-4 w-4 text-primary" />}
      >
        <DataField label="Date" {...getFieldValue("accident", "date")} />
        <DataField label="Heure" {...getFieldValue("accident", "heure")} />
        <DataField label="Lieu" {...getFieldValue("accident", "lieu")} />
        <DataField
          label="Activité"
          {...getFieldValue("accident", "activite_victime")}
        />
        <div className="col-span-2">
          <DataField
            label="Nature de l'accident"
            {...getFieldValue("accident", "nature_accident")}
          />
        </div>
        <DataField
          label="Siège des lésions"
          {...getFieldValue("accident", "siege_lesions")}
        />
        <DataField
          label="Nature des lésions"
          {...getFieldValue("accident", "nature_lesions")}
        />
      </Section>

      {/* Témoin (si présent) */}
      {data.temoin && (data.temoin.nom || data.temoin.prenom) && (
        <Section
          title="Témoin"
          icon={<Users className="h-4 w-4 text-primary" />}
        >
          <DataField label="Nom" {...getFieldValue("temoin", "nom")} />
          <DataField label="Prénom" {...getFieldValue("temoin", "prenom")} />
          <DataField
            label="Adresse"
            {...getFieldValue("temoin", "adresse")}
          />
        </Section>
      )}

      {/* Intérim (si applicable) */}
      {data.type === "AT_interim" && data.interim && (
        <Section
          title="Entreprise de Travail Temporaire"
          icon={<Building2 className="h-4 w-4 text-primary" />}
        >
          <DataField
            label="Entreprise"
            {...getFieldValue("interim", "entreprise_travail_temporaire")}
          />
          <DataField
            label="SIRET agence"
            {...getFieldValue("interim", "siret_agence")}
          />
          <DataField
            label="Adresse agence"
            {...getFieldValue("interim", "adresse_agence")}
          />
        </Section>
      )}
    </div>
  );
}
