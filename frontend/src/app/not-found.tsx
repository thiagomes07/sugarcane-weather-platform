import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-6 px-4 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-status-warning/10 p-6">
            <AlertCircle className="w-16 h-16 text-status-warning" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Página não encontrada</h2>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">Voltar para a Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}