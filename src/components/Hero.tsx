import { useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Slider } from '@/components/ui/Slider'

interface FeaturedBook {
  title: string
  author: string
  category: string
  format: 'PDF' | 'EPUB'
  year: number
  coverUrl: string
  curator: string
}

const FEATURED_BOOKS: FeaturedBook[] = [
  {
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    category: 'Literatura Brasileira',
    format: 'EPUB',
    year: 1899,
    coverUrl: '/covers/dom-casmurro.jpg',
    curator: 'Prof.ª Helena Vasconcelos',
  },
  {
    title: 'Quarto de Despejo',
    author: 'Carolina Maria de Jesus',
    category: 'Literatura Brasileira',
    format: 'PDF',
    year: 1960,
    coverUrl: '/covers/quarto-de-despejo.jpg',
    curator: 'Prof.ª Helena Vasconcelos',
  },
  {
    title: 'Vidas Secas',
    author: 'Graciliano Ramos',
    category: 'Literatura Brasileira',
    format: 'EPUB',
    year: 1938,
    coverUrl: '/covers/vidas-secas.jpg',
    curator: 'Prof. Carlos Mendes',
  },
  {
    title: 'Capitães da Areia',
    author: 'Jorge Amado',
    category: 'Literatura Brasileira',
    format: 'PDF',
    year: 1937,
    coverUrl: '/covers/capitaes-da-areia.jpg',
    curator: 'Prof. Carlos Mendes',
  },
  {
    title: 'O Cortiço',
    author: 'Aluísio Azevedo',
    category: 'Literatura Brasileira',
    format: 'EPUB',
    year: 1890,
    coverUrl: '/covers/o-cortico.jpg',
    curator: 'Prof.ª Lúcia Tavares',
  },
]

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeBook = FEATURED_BOOKS[activeIndex]

  const goPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? FEATURED_BOOKS.length - 1 : prev - 1))
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev === FEATURED_BOOKS.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header institucional limpo */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-6 lg:px-10">
          <a
            href="#inicio"
            className="inline-flex shrink-0 items-center rounded-sm focus-visible:outline-focus"
          >
            <img
              src="/arandu-logo-dark.svg"
              alt="Arandu · Saber Digital"
              className="h-[26px] w-auto select-none md:h-[32px]"
            />
          </a>

          <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
            <a
              href="#acervo"
              className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              Acervo
            </a>
            <a
              href="#como-funciona"
              className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              Como funciona
            </a>
            <a
              href="#sobre"
              className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              Sobre a escola
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-default focus-visible:outline-focus"
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      {/* Hero editorial padrão */}
      <section id="inicio" className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-7 sm:px-6 sm:pb-14 sm:pt-9 lg:px-10 lg:pb-16 lg:pt-11">
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-10">
            {/* Coluna esquerda: texto + KPIs elevados (sem pílula e sem botões) */}
            <div className="min-w-0 lg:col-span-6 lg:pt-2">
              <h1 className="max-w-xl text-[clamp(2rem,4.3vw,3.4rem)] font-bold leading-[1.08] tracking-[-0.03em] text-foreground">
                Leitura gratuita e acessível para cada estudante da escola pública.
              </h1>

              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
                Empreste clássicos da literatura brasileira, apostilas e cadernos de revisão para o
                ENEM em PDF e EPUB — direto no celular ou no computador da escola.
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-separator pt-6 sm:grid-cols-4">
                <div>
                  <dt className="text-xs font-medium text-muted">Obras digitais</dt>
                  <dd className="mt-1 text-2xl font-bold tracking-tight text-foreground">+420</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted">Para estudantes</dt>
                  <dd className="mt-1 text-2xl font-bold tracking-tight text-foreground">100%</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted">Leitura offline</dt>
                  <dd className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    PDF &amp; EPUB
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted">Empréstimo rápido</dt>
                  <dd className="mt-1 text-2xl font-bold tracking-tight text-foreground">7 dias</dd>
                </div>
              </dl>
            </div>

            {/* Coluna direita: Destaques do acervo com capas reais + Slider HeroUI */}
            <div className="min-w-0 lg:col-span-6">
              <div className="rounded-lg border border-border bg-surface-secondary p-5 sm:p-6">
                {/* Cabeçalho da vitrine */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-brilliant-azure-600" aria-hidden="true" />
                    <span className="text-sm font-semibold text-foreground">
                      Destaques do acervo
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="Livro anterior"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors duration-150 hover:bg-default focus-visible:outline-focus"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="Próximo livro"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors duration-150 hover:bg-default focus-visible:outline-focus"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Palco da obra em destaque + miniatura lateral de capas reais */}
                <div className="mt-5 grid items-center gap-5 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <div className="mx-auto aspect-[2/3] max-w-[190px] overflow-hidden rounded-md border border-border bg-surface shadow-md sm:max-w-none">
                      <img
                        src={activeBook.coverUrl}
                        alt={`Capa de ${activeBook.title}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 sm:col-span-7">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-xs bg-surface px-2 py-0.5 text-[11px] font-semibold text-foreground border border-border">
                          {activeBook.format}
                        </span>
                        <span className="text-xs font-medium text-muted">
                          {activeBook.category}
                        </span>
                      </div>

                      <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-foreground">
                        {activeBook.title}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-muted">
                        {activeBook.author} • {activeBook.year}
                      </p>
                    </div>

                    {/* Miniaturas clicáveis das 5 capas reais */}
                    <div
                      role="group"
                      aria-label="Selecionar obra em destaque"
                      className="grid grid-cols-5 gap-2"
                    >
                      {FEATURED_BOOKS.map((book, idx) => {
                        const isSelected = idx === activeIndex
                        return (
                          <button
                            key={book.title}
                            type="button"
                            onClick={() => setActiveIndex(idx)}
                            aria-label={book.title}
                            aria-pressed={isSelected}
                            className={`overflow-hidden rounded-sm border transition-all duration-150 focus-visible:outline-focus ${
                              isSelected
                                ? 'scale-105 border-shadow-grey ring-2 ring-accent'
                                : 'border-border opacity-70 hover:opacity-100'
                            }`}
                          >
                            <div className="aspect-[2/3] w-full bg-surface">
                              <img
                                src={book.coverUrl}
                                alt={book.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Slider HeroUI para navegar entre as capas */}
                <div className="mt-6 border-t border-separator pt-4">
                  <Slider
                    minValue={0}
                    maxValue={FEATURED_BOOKS.length - 1}
                    step={1}
                    value={activeIndex}
                    onChange={(val) => setActiveIndex(Array.isArray(val) ? val[0] : val)}
                    aria-label="Navegar pelos destaques do acervo"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Slider.Label>Deslize para folhear os destaques</Slider.Label>
                      <Slider.Output>
                        {() => `${activeIndex + 1} de ${FEATURED_BOOKS.length} • ${activeBook.title}`}
                      </Slider.Output>
                    </div>
                    <Slider.Track>
                      <Slider.Thumb aria-label="Selecionar livro em destaque" />
                    </Slider.Track>
                  </Slider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
