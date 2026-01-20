import Link from 'next/link';
import { Network, Heart, History } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-4xl w-full text-center space-y-8">

        {/* Hero Section */}
        <div className="space-y-4 animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Network className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Sua História, <span className="text-primary">Conectada</span>.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Uma árvore genealógica digital para preservar memórias, conectar gerações e organizar o legado da sua família.
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-8">
          <Link
            href="/tree"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Começar Agora
          </Link>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-8 pt-16 text-left">
          <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
            <Heart className="w-8 h-8 text-rose-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Conexões Reais</h3>
            <p className="text-muted-foreground">Visualize como cada membro da família se conecta através das gerações.</p>
          </div>
          <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
            <History className="w-8 h-8 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Linha do Tempo</h3>
            <p className="text-muted-foreground">Documente datas importantes e veja a história se desenrolar cronologicamente.</p>
          </div>
          <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mb-4">AI</div>
            <h3 className="text-xl font-bold mb-2">Resumos Inteligentes</h3>
            <p className="text-muted-foreground">Use IA para criar biografias ricas baseadas em fotos e memórias compartilhadas.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
