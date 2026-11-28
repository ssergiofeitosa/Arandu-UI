# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Estudantes do Ensino Médio** do *Colégio Estadual de Tempo Integral Paulo José de Oliveira*, acessando por celulares simples com internet limitada ou computadores da escola para descobrir obras, emprestar e ler.
- **Docentes e Coordenação de Acervo**, responsáveis por cadastrar obras digitais no catálogo, definir disponibilidade e cadastrar/gerenciar os estudantes na plataforma.

## Product Purpose

**Arandu · Saber Digital** é a biblioteca digital escolar gratuita do *Colégio Estadual de Tempo Integral Paulo José de Oliveira*. Centraliza clássicos da literatura brasileira, apostilas escolares e cadernos de revisão para o ENEM em um único catálogo institucional, facilitando o empréstimo e a leitura pelos alunos e o gerenciamento de acervo e turmas pelos professores.

## Positioning

Plataforma institucional dedicada à escola pública estadual que diferencia claramente duas modalidades de acesso:
- **Obras em domínio público (e apostilas institucionais):** download direto (sem necessidade de empréstimo) em **PDF ou EPUB**, com recomendação prática de aplicativos gratuitos para leitura offline no celular ou computador; obras em PDF também podem ser lidas no navegador.
- **Obras em aluguel temporário:** arquivo estritamente em **PDF**, exigindo empréstimo temporário com leitura protegida diretamente no visualizador de PDF do navegador (`pdfjs-dist`), sem depender de instalação de leitores externos nem expor o arquivo bruto.

## Operating Context

- Autenticação JWT, RBAC (`ALUNO` / `BIBLIOTECARIO`), recuperação de senha, gestão real de **Alunos e Turmas** (`apps/contas`) e **Catálogo, Detalhes, Avaliações e Gestão do Acervo com Upload PDF/EPUB** (`apps/arandu`) já integrados ao backend Django. Empréstimos ACID e leitor/download protegido (`/ler/` e `/download/`) entram na próxima etapa.
- Ambiente real de uso inclui dispositivos móveis de entrada, redes escolares com banda limitada e computadores compartilhados da escola.

## Capabilities and Constraints

- **Fluxos confirmados:** vitrine institucional (`/`), autenticação JWT (`/login`), recuperação de senha (`/esqueci-senha` e `/redefinir-senha`), catálogo filtrável por categoria/formato/busca (`/catalogo`), página da obra (`/livros/:id`), estante de empréstimos do estudante (`/meus-emprestimos`) e painel docente com gestão do acervo e cadastro/edição/ativação de alunos (`/admin-acervo`).
- **Regra de leitura e empréstimo:** obras de domínio público liberam download direto (PDF ou EPUB) com recomendação de apps; obras de aluguel temporário (somente PDF) exigem empréstimo para leitura no visualizador web embutido no navegador.
- **Decisão em aberto:** a duração exata do prazo de aluguel temporário ainda não está definida (não fixar quantidade específica de dias como regra permanente do produto).
- **RBAC ativo:** `DevRoleSwitcher` removido; o controle de acesso separa permissões de estudante (`catalog:read`, `loans:self`) e bibliotecário/docente (`catalog:read`, `admin:*`) com validação real na API Django.

## Brand Commitments

- Nome oficial: **Arandu · Saber Digital**.
- Instituição vinculada: *Colégio Estadual de Tempo Integral Paulo José de Oliveira*.
- Comunicação 100% em português brasileiro acessível, objetiva e não punitiva (especialmente em avisos de atraso ou erros de formulário).
- Ativos oficiais de marca: `public/arandu-logo-dark.svg` e `public/arandu-logo-clear.svg`.
- Landing page (`/`): seção Hero mantida limpa sem botões extras no bloco inicial (acesso via barra superior e destaques do acervo).

## Evidence on Hand

- 5 capas reais em `public/covers/` (`dom-casmurro.jpg`, `quarto-de-despejo.jpg`, `vidas-secas.jpg`, `capitaes-da-areia.jpg`, `o-cortico.jpg`).
- Catálogo inicial, empréstimos e lista de estudantes atualmente mockados em `src/data/mockData.ts`.
- Números de acervo, downloads e estatísticas reais de uso ainda não existem em produção e não devem ser tratados como métricas verificadas.

## Product Principles

- **Leveza em qualquer aparelho:** priorizar legibilidade, carregamento rápido e fluxos diretos mesmo em celulares simples e telas pequenas.
- **Clareza entre download e aluguel:** deixar imediato para o estudante quando uma obra pode ser baixada (e como abri-la) e quando a leitura acontece no navegador.
- **Autonomia docente sem fricção:** cadastrar livros e alunos em poucos passos, com validações claras e prevenção contra ações acidentais.
- **Tom acolhedor e institucional:** orientar em linguagem simples e evitar jargões técnicos ou avisos punitivos ao estudante.

## Accessibility & Inclusion

- Conformidade com **WCAG AA**: contraste mínimo `4.5:1` para texto normal (`>= 3:1` em textos grandes), navegação completa por teclado, foco visível e diálogos acessíveis (`Esc`, focus trap, anúncios `role="alert"`).
- Desempenho e consumo de dados leves pensados para estudantes com celulares de entrada e conectividade limitada.
