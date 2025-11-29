'use client'

import Link from "next/link"
import { Sprout, Github } from "lucide-react"
import { Container } from "./Container"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Sprout className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary leading-none">
                Cana Data
              </span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                Inteligência Climática
              </span>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
            >
              Clima
            </Link>
            <Link
              href="#insights"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
            >
              Insights
            </Link>
            <Link
              href="#noticias"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
            >
              Notícias
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hidden sm:inline-flex"
            >
              <a
                href="https://github.com/thiagomes07/sugarcane-weather-platform"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </Container>
    </header>
  )
}