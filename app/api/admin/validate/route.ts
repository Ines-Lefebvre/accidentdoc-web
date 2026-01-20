import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ValidateRequest {
  dossier_id: string;
  letter_text: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Parser la requête
    const body: ValidateRequest = await request.json();
    const { dossier_id, letter_text } = body;

    if (!dossier_id || !letter_text) {
      return NextResponse.json(
        { error: "dossier_id et letter_text requis" },
        { status: 400 }
      );
    }

    // Récupérer le dossier
    const { data: dossier, error: fetchError } = await supabase
      .from("dossiers")
      .select("*")
      .eq("id", dossier_id)
      .single();

    if (fetchError || !dossier) {
      return NextResponse.json(
        { error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    // Générer le PDF avec signature
    const pdfBytes = await generateSignedPDF(letter_text);

    // Envoyer l'email avec le PDF en pièce jointe
    const victimeName = dossier.context
      ? `${dossier.context.victime_prenom || ""} ${dossier.context.victime_nom || ""}`.trim()
      : "votre dossier";

    const { error: emailError } = await resend.emails.send({
      from: "AccidentDoc <noreply@accidentdoc.fr>",
      to: dossier.customer_email,
      subject: "Votre lettre de réserves AT/MP validée",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Votre lettre de réserves est prête</h2>

          <p>Bonjour,</p>

          <p>Votre lettre de réserves concernant ${victimeName} a été validée par notre avocate partenaire et est jointe à cet email.</p>

          <p><strong>Prochaines étapes :</strong></p>
          <ol>
            <li>Téléchargez et imprimez la lettre ci-jointe</li>
            <li>Envoyez-la par courrier recommandé avec accusé de réception à votre CPAM</li>
            <li>Conservez une copie de l'accusé de réception</li>
          </ol>

          <p><strong>Important :</strong> Cette lettre doit être envoyée dans les délais légaux pour être valable.</p>

          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>

          <p style="margin-top: 30px;">
            Cordialement,<br>
            <strong>L'équipe AccidentDoc</strong>
          </p>

          <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">
            AccidentDoc - Vos droits, nos experts<br>
            <a href="https://accidentdoc.fr">accidentdoc.fr</a>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `lettre-reserves-${dossier.request_id}.pdf`,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ],
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    // Mettre à jour le statut du dossier
    const { error: updateError } = await supabase
      .from("dossiers")
      .update({
        status: "sent",
        letter_text: letter_text,
        validated_at: new Date().toISOString(),
        validated_by: user.id,
      })
      .eq("id", dossier_id);

    if (updateError) {
      console.error("Error updating dossier:", updateError);
      // L'email a déjà été envoyé, on log l'erreur mais on continue
    }

    return NextResponse.json({
      success: true,
      message: "Lettre validée et envoyée avec succès",
    });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

async function generateSignedPDF(letterText: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Configuration de la page A4
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const lineHeight = 14;
  const fontSize = 11;

  // Charger les fonts
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Découper le texte en lignes
  const maxWidth = pageWidth - 2 * margin;
  const paragraphs = letterText.split("\n");

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;

  // Fonction pour ajouter du texte avec gestion des retours à la ligne
  function addText(text: string, isBold = false) {
    const currentFont = isBold ? fontBold : font;
    const words = text.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      const textWidth = currentFont.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxWidth && line) {
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition < margin + 100) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }

        currentPage.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: currentFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }

    // Écrire la dernière ligne
    if (line) {
      if (yPosition < margin + 100) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      currentPage.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: currentFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }
  }

  // Ajouter chaque paragraphe
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      yPosition -= lineHeight; // Ligne vide
    } else {
      addText(paragraph);
    }
  }

  // Ajouter la signature
  yPosition -= lineHeight * 2;

  // Charger l'image de signature si disponible
  try {
    const signatureUrl =
      process.env.SIGNATURE_URL || "/signature-avocat.png";

    // En production, charger depuis une URL publique ou Supabase Storage
    if (signatureUrl.startsWith("http")) {
      const signatureResponse = await fetch(signatureUrl);
      const signatureBytes = await signatureResponse.arrayBuffer();
      const signatureImage = await pdfDoc.embedPng(signatureBytes);

      // Vérifier si on a besoin d'une nouvelle page pour la signature
      if (yPosition < margin + 80) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      currentPage.drawImage(signatureImage, {
        x: margin,
        y: yPosition - 60,
        width: 150,
        height: 50,
      });
    }
  } catch (signatureError) {
    console.warn(
      "Could not load signature image, continuing without it:",
      signatureError
    );
  }

  // Ajouter le texte de signature
  yPosition -= 70;
  currentPage.drawText("Validé par l'avocate partenaire AccidentDoc", {
    x: margin,
    y: yPosition,
    size: 9,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  return await pdfDoc.save();
}
