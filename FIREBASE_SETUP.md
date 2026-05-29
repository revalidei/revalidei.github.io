# Configuração do Firebase Authentication

## 1. Console Firebase

1. Crie um projeto em [Firebase Console](https://console.firebase.google.com).
2. Adicione um app **Web** e copie o objeto `firebaseConfig`.
3. Em **Authentication → Sign-in method**, habilite:
   - **E-mail/senha**
   - **Google** (opcional, para o botão na tela de login)
4. Em **Authentication → Settings → Authorized domains**, inclua:
   - `localhost`
   - `wenglesvitali-spec.github.io` (ou seu domínio do GitHub Pages)

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

## 4. Deploy (GitHub Pages)

Após o deploy, confirme que o domínio do site está em **Authorized domains** no Firebase.
