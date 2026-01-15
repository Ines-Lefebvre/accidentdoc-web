import Link from "next/link";
import {
  FileText,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="font-heading text-xl font-semibold text-primary">
              Accident Doc
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#fonctionnement"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Comment ça marche
            </Link>
            <Link
              href="#tarifs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="/avocate/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Espace Avocat
            </Link>
          </nav>
          <Button asChild>
            <Link href="/upload">Commencer</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-primary mb-6 max-w-4xl mx-auto leading-tight">
            Protégez votre entreprise contre les AT/MP abusifs
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Lettre de réserves rédigée par intelligence artificielle, validée
            par un avocat spécialisé. Simple, rapide, efficace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="xl" variant="accent">
              <Link href="/upload">
                Commencer maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="#fonctionnement">En savoir plus</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            À partir de <span className="font-semibold text-foreground">69€</span> •
            Validé par avocat • Résultat en 24h
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnement" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden">
              <div className="absolute top-4 left-4 step-indicator">1</div>
              <CardContent className="pt-16 pb-8 px-6">
                <FileText className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-heading text-xl font-semibold mb-2">
                  Uploadez votre déclaration
                </h3>
                <p className="text-muted-foreground">
                  Téléversez le CERFA ou prenez-le en photo. Notre IA extrait
                  automatiquement les informations.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-4 left-4 step-indicator">2</div>
              <CardContent className="pt-16 pb-8 px-6">
                <Shield className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-heading text-xl font-semibold mb-2">
                  Exprimez vos doutes
                </h3>
                <p className="text-muted-foreground">
                  Dictez ou écrivez vos réserves. Notre système analyse vos
                  arguments et structure votre lettre.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-4 left-4 step-indicator">3</div>
              <CardContent className="pt-16 pb-8 px-6">
                <CheckCircle className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-heading text-xl font-semibold mb-2">
                  Recevez votre lettre
                </h3>
                <p className="text-muted-foreground">
                  Un avocat valide votre lettre et vous la recevez par email,
                  prête à être envoyée à la CPAM.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center mb-4">
            Tarifs transparents
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Un prix fixe, sans surprise. Validé par un avocat inscrit au Barreau
            de Paris.
          </p>
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-primary">
              <CardContent className="p-8 text-center">
                <p className="text-sm font-medium text-primary uppercase tracking-wide mb-2">
                  Lettre de réserves
                </p>
                <div className="mb-4">
                  <span className="text-5xl font-bold">69€</span>
                  <span className="text-muted-foreground ml-1">HT</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Extraction automatique du CERFA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Analyse de vos réserves</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Rédaction personnalisée</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Validation par avocat</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Livraison sous 24h</span>
                  </li>
                </ul>
                <Button asChild size="lg" className="w-full" variant="accent">
                  <Link href="/upload">Commencer maintenant</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-bold mb-6">
            Un service juridique de confiance
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Chaque lettre est validée par{" "}
            <strong>Maître Carine Bailly Lacresse</strong>, avocate spécialisée
            en AT/MP, inscrite au Barreau de Paris.
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <p className="font-semibold">24h</p>
              <p className="text-sm opacity-80">Délai moyen</p>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <p className="font-semibold">100%</p>
              <p className="text-sm opacity-80">Validé par avocat</p>
            </div>
            <div className="text-center">
              <Scale className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <p className="font-semibold">RGPD</p>
              <p className="text-sm opacity-80">Données protégées</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <span className="font-heading font-semibold text-primary">
                Accident Doc
              </span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Service juridique par Maître Carine Bailly Lacresse, Barreau de Paris
            </p>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/mentions-legales" className="hover:text-foreground">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="hover:text-foreground">
                Confidentialité
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
