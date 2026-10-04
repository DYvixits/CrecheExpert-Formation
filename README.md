# Enhanced Vite React TypeScript Template

This template includes built-in detection for missing CSS variables between your Tailwind config and CSS files.

## Coffre-fort : fonction `vault-document` (Netlify)

Blink storage n'a aucune notion de fichier privé ou d'URL signée : `blink.storage.upload()` renvoie
toujours un lien public permanent. `netlify/functions/vault-document.ts` est la vraie barrière de
confidentialité — elle vérifie côté serveur (avec la `secretKey` Blink, jamais exposée au client)
que l'appelant possède le document ou gère sa structure, avant de streamer le fichier. Le navigateur
ne reçoit plus jamais l'URL de stockage brute.

À configurer dans les variables d'environnement Netlify (jamais dans `.env.local`, jamais commité) :

- `BLINK_SECRET_KEY` — générée depuis le dashboard du projet Blink (clé serveur, permanente).
- `BLINK_PROJECT_ID` — optionnel si `VITE_BLINK_PROJECT_ID` est déjà défini, sinon requis.

Sans ces variables, la fonction répond `500` sur toute consultation/suppression de document.
Limite connue : les réponses Netlify Functions synchrones plafonnent autour de 6 Mo — un document
scanné plus volumineux échouera avec une `502` (nécessiterait une réécriture en Edge Function pour
du streaming).

## Features

- **CSS Variable Detection**: Automatically detects if CSS variables referenced in `tailwind.config.cjs` are defined in `src/index.css`
- **Enhanced Linting**: Includes ESLint, Stylelint, and custom CSS variable validation
- **Shadcn/ui**: Pre-configured with all Shadcn components
- **Modern Stack**: Vite + React + TypeScript + Tailwind CSS

## Available Scripts

```bash
# Run all linting (includes CSS variable check)
npm run lint

# Check only CSS variables
npm run check:css-vars

# Individual linting
npm run lint:js    # ESLint
npm run lint:css   # Stylelint
```

## CSS Variable Detection

The template includes a custom script that:

1. **Parses `tailwind.config.cjs`** to find all `var(--variable)` references
2. **Parses `src/index.css`** to find all defined CSS variables (`--variable:`)
3. **Cross-references** them to find missing definitions
4. **Reports undefined variables** with clear error messages

### Example Output

When CSS variables are missing:
```
❌ Undefined CSS variables found in tailwind.config.cjs:
   --sidebar-background
   --sidebar-foreground
   --sidebar-primary

Add these variables to src/index.css
```

When all variables are defined:
```
✅ All CSS variables in tailwind.config.cjs are defined
```

## How It Works

The detection happens during the `npm run lint` command, which will:
- Exit with error code 1 if undefined variables are found
- Show exactly which variables need to be added to your CSS file
- Integrate seamlessly with your development workflow

This prevents runtime CSS issues where Tailwind classes reference undefined CSS variables.