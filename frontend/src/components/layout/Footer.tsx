import Link from "next/link"
import { Sprout, Github, Mail } from "lucide-react"
import { Container } from "./Container"
import { Phone } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <Container>
        <div className="py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                  <Sprout className="h-6 w-6" />
                </div>
                <span className="text-lg font-bold text-primary">
                  Cana Data
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Plataforma de monitoramento climático especializada em
                cana-de-açúcar. Dados precisos, análises contextualizadas e
                comunidade de produtores compartilhando conhecimento.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Plataforma</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Clima
                  </Link>
                </li>
                <li>
                  <Link
                    href="#insights"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Insights
                  </Link>
                </li>
                <li>
                  <Link
                    href="#noticias"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Notícias
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Contato</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/thiagomes07"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:thiagogomesalmeida27@gmail.com"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/5511953015481"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-muted-foreground">
                © {currentYear} Cana Data. Todos os direitos reservados.
              </p>
              <div className="flex gap-6">
                <span
                  title="Ainda não implementado"
                  className="text-xs text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  Privacidade
                </span>
                <span
                  title="Ainda não implementado"
                  className="text-xs text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  Termos de Uso
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  )
}
