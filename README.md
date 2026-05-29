# Portal Revalida 2026

Plataforma de estudos para o Revalida INEP (questões, provas, dashboard e revisão).

## Autenticação (Firebase)

O login usa **Firebase Authentication** (e-mail/senha e Google). Antes de rodar o app:

1. Siga o guia [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. Copie `js/firebase-config.example.js` → `js/firebase-config.js` e preencha com seu `firebaseConfig`

## Rodar localmente

```bash
npx serve .
```

Abra `http://localhost:3000/login.html` (não abra os HTML direto pelo explorador de arquivos).

## Deploy (GitHub Pages)

Push na branch `main` dispara o workflow que gera `js/firebase-config.js` a partir do secret `FIREBASE_CONFIG` e publica o site. Detalhes em [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

## Personalizar o site

Nome, Instagram, estatísticas da home e meta de estudo: edite [js/site-config.js](js/site-config.js). Guia completo em [CONFIGURACAO.md](CONFIGURACAO.md).

## Estrutura

- `login.html` / `dashboard.html` — entrada e painel
- `pages/PROVAS/` — simulados por edição
- `conteudo/*.json` — banco de questões (veja `conteudo/README.md`)
- `js/auth-guard.js` — proteção de páginas internas
- `js/app.js` / `sw.js` — utilitários e cache offline (PWA)
- `pages/flashcards.html` — revisão rápida em cards
