# Configuração do site

Edite **`js/site-config.js`** e faça push na branch `main`. O deploy automático atualiza o site em alguns minutos.

## O que você pode mudar

| Campo | Exemplo | Onde aparece |
|-------|---------|----------------|
| `brand.name` | `REVALIDEI` | Logo, sidebar, Open Graph |
| `brand.product` | `Revalida 2026` | Títulos e PWA |
| `contact.instagram` | `@revalideimedicina` | Login |
| `contact.instagramUrl` | URL do perfil | Link clicável no login |
| `meta.description` | texto SEO | Google / compartilhamento |
| `meta.siteUrl` | `https://revalidei.github.io` | Open Graph |
| `stats.*` | números da home | Cards da landing |
| `study.metaAproveitamento` | `70` | Meta no dashboard (%) |
| `features.googleLogin` | `true` / `false` | Botão Google no login |
| `features.residencia` | `false` | Reservado para bancas futuras |

## Firebase (login)

Credenciais **não** vão em `site-config.js`. Use:

- Local: `js/firebase-config.js` (cópia do `.example`)
- Produção: secret `FIREBASE_CONFIG` no GitHub

Detalhes: [FIREBASE_SETUP.md](FIREBASE_SETUP.md) (inclui Firestore para provas salvas, flashcards, cronograma e histórico na nuvem).

## Ícones PWA

Substitua na raiz do projeto:

- `icon-192.png`
- `icon-512.png`

Mantém o verde da marca ou envie sua logo nesses tamanhos.
