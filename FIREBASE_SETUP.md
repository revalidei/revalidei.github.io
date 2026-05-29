# Configuração do Firebase Authentication

## 1. Console Firebase

1. Crie um projeto em [Firebase Console](https://console.firebase.google.com).
2. Adicione um app **Web** e copie o objeto `firebaseConfig`.
3. Em **Authentication → Sign-in method**, habilite:
   - **E-mail/senha**
   - **Google** (opcional, para o botão na tela de login)
4. Em **Authentication → Settings → Authorized domains**, inclua:
   - `localhost`
   - `revalidei.github.io`

## 2. Arquivo local de configuração

```bash
cp js/firebase-config.example.js js/firebase-config.js
```

Edite `js/firebase-config.js` com os valores do Console. Este arquivo está no `.gitignore` e **não deve ser commitado**.

## 3. Testar localmente

Sirva o projeto com um servidor HTTP (módulos ES não funcionam com `file://`):

```bash
npx serve .
```

Acesse `http://localhost:3000/login.html`.

## 4. Deploy automático (GitHub Actions)

O workflow `.github/workflows/deploy-pages.yml` publica o site em cada push na branch `main`.

### 4.1 Secret no GitHub

1. No Firebase Console, copie o objeto `firebaseConfig` do app Web (um JSON com `apiKey`, `authDomain`, etc.).
2. No repositório GitHub: **Settings → Secrets and variables → Actions → New repository secret**
3. Nome: `FIREBASE_CONFIG`
4. Valor: cole o JSON **inteiro**, por exemplo:

```json
{
  "apiKey": "AIza...",
  "authDomain": "seu-projeto.firebaseapp.com",
  "projectId": "seu-projeto",
  "storageBucket": "seu-projeto.firebasestorage.app",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef"
}
```

### 4.2 GitHub Pages via Actions

1. **Settings → Pages**
2. **Build and deployment → Source:** escolha **GitHub Actions** (não “Deploy from branch”, se estiver assim).
3. Faça push na `main` ou rode o workflow manualmente em **Actions → Deploy GitHub Pages → Run workflow**.

O arquivo `js/firebase-config.js` é gerado só no CI e **não** precisa ser commitado.

### 4.3 Conferir após o deploy

- Domínio `revalidei.github.io` em **Authorized domains** no Firebase.
- Login em https://revalidei.github.io/login.html
